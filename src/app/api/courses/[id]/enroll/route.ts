export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, enrollments, payments, results, courseFaculty, waitlists, schedule, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, sql, or } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const courseId = params.id;
    const studentId = payload.id as string;

    const body = await req.json().catch(() => ({}));
    const { courseFacultyId } = body;

    if (!courseFacultyId) {
      return errorResponse("You must select a faculty to enroll.", 400);
    }

    const [user] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!user) return errorResponse("User not found", 404);

    // 1. Fee Gatekeeper: Check for pending dues
    const pendingFees = await db.select()
      .from(payments)
      .where(and(eq(payments.userId, studentId), eq(payments.status, 'PENDING')));
    
    if (pendingFees.length > 0) {
      return errorResponse("You have pending fee dues. Please clear them before registering.", 402);
    }

    // 2. Fetch Course & Faculty details
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) return errorResponse("Course not found", 404);

    const [facultySection] = await db.select().from(courseFaculty).where(eq(courseFaculty.id, courseFacultyId)).limit(1);
    if (!facultySection || facultySection.courseId !== courseId) {
      return errorResponse("Invalid faculty selection.", 400);
    }

    // Cross-Department Blocker
    if (!course.isOpenElective && course.categoryId !== user.departmentId) {
      return errorResponse("This is a core course for another department. You cannot enroll unless it is an Open Elective.", 403);
    }

    // 3. Prerequisite Check
    if (course.prerequisiteCourseId) {
      const [prereqResult] = await db.select()
        .from(results)
        .where(and(eq(results.userId, studentId), eq(results.courseId, course.prerequisiteCourseId)))
        .limit(1);
      
      if (!prereqResult || prereqResult.status === 'FAIL') {
        return errorResponse("Cannot enroll. Prerequisite not cleared.", 403);
      }
    }

    // 4. Duplicate Check
    const [existingEnrollment] = await db.select().from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId))).limit(1);
    if (existingEnrollment) return errorResponse("Already enrolled in this course.", 400);

    const [existingWaitlist] = await db.select().from(waitlists)
      .where(and(eq(waitlists.studentId, studentId), eq(waitlists.courseFacultyId, courseFacultyId))).limit(1);
    if (existingWaitlist) return errorResponse("You are already on the waitlist for this faculty.", 400);

    // 4b. Max Credits Limit (24)
    const currentEnrollments = await db.select({
      id: enrollments.id,
      courseId: enrollments.courseId,
      credits: courses.credits
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.studentId, studentId));
    
    const totalCredits = currentEnrollments.reduce((sum, e) => sum + (e.credits || 0), 0);
    if (totalCredits + (course.credits || 0) > 24) {
      return errorResponse(`Enrolling in this course exceeds the 24 credit limit per semester. You currently have ${totalCredits} credits.`, 403);
    }

    // 5. Time Schedule Conflicts (Basic overlap check)
    // Get schedules for the target faculty section
    const targetSchedules = await db.select().from(schedule).where(eq(schedule.courseId, courseId));
    // Ideally schedule would link to courseFacultyId, but right now we check courseId + teacherId
    const targetFacultySchedules = targetSchedules.filter(s => s.teacherId === facultySection.teacherId);
    
    if (targetFacultySchedules.length > 0) {
      if (currentEnrollments.length > 0) {
        // Just checking if any schedule matches the exact date/time. 
        // Real-world would check ranges, but this simulates the conflict engine.
        for (const target of targetFacultySchedules) {
          const conflicts = await db.select().from(schedule)
            .where(and(
              eq(schedule.date, target.date), 
              eq(schedule.time, target.time),
              or(...currentEnrollments.map(e => eq(schedule.courseId, e.courseId)))
            )).limit(1);
          
          if (conflicts.length > 0) {
            return errorResponse("Time schedule conflict with an existing course.", 409);
          }
        }
      }
    }

    // 6. Capacity Check & Transaction Simulation
    // Since Drizzle simple sqlite doesn't expose easy cross-table transactions natively without raw queries,
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollments)
      .where(eq(enrollments.courseFacultyId, courseFacultyId));
    
    if (count >= facultySection.capacity) {
      // Waitlist Cap Check
      const [{ waitlistCount }] = await db.select({ waitlistCount: sql<number>`count(*)::int` }).from(waitlists)
        .where(eq(waitlists.courseFacultyId, courseFacultyId));
      
      const maxWaitlist = Math.ceil(facultySection.capacity * 0.10);
      if (waitlistCount >= maxWaitlist) {
        return errorResponse("Waitlist is completely full for this faculty.", 403);
      }

      // Waitlist them!
      const newWaitlist = await db.insert(waitlists).values({
        studentId,
        courseFacultyId
      }).returning();
      
      return successResponse({ waitlisted: true, entry: newWaitlist[0] }, "Faculty capacity is full. You have been added to the waitlist.", 202);
    } else {
      // Enroll them!
      const newEnrollment = await db.insert(enrollments).values({
        studentId,
        courseId,
        courseFacultyId
      }).returning();

      return successResponse({ enrolled: true, enrollment: newEnrollment[0] }, "Successfully enrolled in course with chosen faculty.", 201);
    }
  } catch (error) {
    console.error("Enrollment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
