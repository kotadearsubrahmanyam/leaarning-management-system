export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentActivities, enrollments, courseFaculty, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, inArray, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Unauthorized", 401);

    const teacherId = payload.id as string;

    // 1. Find all faculty sections taught by this teacher
    const sections = await db.select({ id: courseFaculty.id })
      .from(courseFaculty)
      .where(eq(courseFaculty.teacherId, teacherId));
      
    const sectionIds = sections.map(s => s.id);
    console.log("Teacher section IDs:", sectionIds);
    if (sectionIds.length === 0) {
       return successResponse({ activities: [] }, "Fetched activities successfully");
    }

    // 2. Find all unique student IDs enrolled in those sections
    const enrolledStudents = await db.select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(inArray(enrollments.courseFacultyId, sectionIds));
      
    const studentIds = Array.from(new Set(enrolledStudents.map(e => e.studentId)));
    console.log("Enrolled Student IDs:", studentIds);
    
    if (studentIds.length === 0) {
      return successResponse({ activities: [] }, "Fetched activities successfully");
    }

    // 3. Fetch all activities for those students
    const activities = await db.select({
      id: studentActivities.id,
      title: studentActivities.title,
      type: studentActivities.type,
      description: studentActivities.description,
      proofUrl: studentActivities.proofUrl,
      date: studentActivities.date,
      marks: studentActivities.marks,
      evaluatedAt: studentActivities.createdAt, // fallback to creation date if needed
      studentName: users.name,
      studentEmail: users.email,
      studentRoll: users.rollNumber,
      evaluatedBy: studentActivities.evaluatedBy,
    })
    .from(studentActivities)
    .innerJoin(users, eq(studentActivities.studentId, users.id))
    .where(inArray(studentActivities.studentId, studentIds))
    .orderBy(desc(studentActivities.createdAt));
    
    // Quick lookup for teacher names who evaluated
    const evaluatedTeacherIds = Array.from(new Set(activities.map(a => a.evaluatedBy).filter(Boolean))) as string[];
    let teacherLookup: Record<string, string> = {};
    if (evaluatedTeacherIds.length > 0) {
      const teachers = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, evaluatedTeacherIds));
      teacherLookup = teachers.reduce((acc, t) => { acc[t.id] = t.name; return acc; }, {} as Record<string, string>);
    }

    const formattedActivities = activities.map(a => ({
      ...a,
      evaluatorName: a.evaluatedBy ? teacherLookup[a.evaluatedBy] : null
    }));
    
    console.log("Returning activities:", formattedActivities.length);

    return successResponse({ activities: formattedActivities }, "Fetched activities successfully");
  } catch (error: any) {
    console.error("Fetch activities error:", error);
    return errorResponse("Internal server error", 500);
  }
}
