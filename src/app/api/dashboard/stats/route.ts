import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, courses, enrollments, materials, materialProgress, assignments, submissions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return errorResponse("Invalid token", 401);
    }

    const { id, role } = payload;
    let stats: any = {};

    if (role === "ADMIN") {
      const [totalUsersRes] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
      const [totalCoursesRes] = await db.select({ count: sql<number>`count(*)::int` }).from(courses);
      const [totalEnrollmentsRes] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollments);
      
      const platformGrowth = await db
        .select({
          name: sql<string>`to_char(${users.createdAt}, 'Mon')`,
          value: sql<number>`count(*)::int`,
        })
        .from(users)
        .groupBy(sql`to_char(${users.createdAt}, 'Mon'), extract(month from ${users.createdAt})`)
        .orderBy(sql`extract(month from ${users.createdAt})`);

      const enrollmentTrends = await db
        .select({
          name: sql<string>`to_char(${enrollments.createdAt}, 'Mon')`,
          value: sql<number>`count(*)::int`,
        })
        .from(enrollments)
        .groupBy(sql`to_char(${enrollments.createdAt}, 'Mon'), extract(month from ${enrollments.createdAt})`)
        .orderBy(sql`extract(month from ${enrollments.createdAt})`);
      
      stats = {
        totalUsers: totalUsersRes?.count || 0,
        totalCourses: totalCoursesRes?.count || 0,
        totalEnrollments: totalEnrollmentsRes?.count || 0,
        platformGrowth,
        enrollmentTrends
      };
    } else if (role === "TEACHER") {
      const [coursesCreatedRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courses)
        .where(eq(courses.teacherId, id as string));

      const [totalStudentsRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(courses.teacherId, id as string));

      const [totalAssignmentsRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .where(eq(courses.teacherId, id as string));

      const [pendingEvaluationsRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .where(sql`${courses.teacherId} = ${id as string} AND ${submissions.status} = 'SUBMITTED'`);

      const studentEnrollmentHistory = await db
        .select({
          name: sql<string>`to_char(${enrollments.createdAt}, 'Mon')`,
          value: sql<number>`count(*)::int`,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(courses.teacherId, id as string))
        .groupBy(sql`to_char(${enrollments.createdAt}, 'Mon'), extract(month from ${enrollments.createdAt})`)
        .orderBy(sql`extract(month from ${enrollments.createdAt})`);

      const coursePopularity = await db
        .select({
          name: courses.title,
          value: sql<number>`count(${enrollments.id})::int`,
        })
        .from(courses)
        .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
        .where(eq(courses.teacherId, id as string))
        .groupBy(courses.id, courses.title)
        .orderBy(sql`count(${enrollments.id}) DESC`)
        .limit(5);

      stats = {
        coursesCreated: coursesCreatedRes?.count || 0,
        totalStudentsEnrolled: totalStudentsRes?.count || 0,
        studentEnrollmentHistory,
        coursePopularity,
        totalAssignments: totalAssignmentsRes?.count || 0,
        pendingEvaluations: pendingEvaluationsRes?.count || 0,
      };
    } else {
      // STUDENT
      const [enrolledCoursesRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(eq(enrollments.studentId, id as string));

      const [completedCoursesRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(sql`${enrollments.studentId} = ${id as string} AND ${enrollments.status} = 'COMPLETED'`);

      const enrolledCoursesList = await db
        .select({ id: courses.id, title: courses.title })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.studentId, id as string))
        .limit(5);
        
      const courseProgress = [];
      for (const course of enrolledCoursesList) {
        const totalMats = await db.select({ id: materials.id }).from(materials).where(eq(materials.courseId, course.id));
        const completedMats = await db
          .select({ id: materialProgress.id })
          .from(materialProgress)
          .innerJoin(materials, eq(materialProgress.materialId, materials.id))
          .where(sql`${materialProgress.studentId} = ${id as string} AND ${materials.courseId} = ${course.id} AND ${materialProgress.isCompleted} = true`);
        
        const pct = totalMats.length > 0 ? Math.round((completedMats.length / totalMats.length) * 100) : 0;
        courseProgress.push({ name: course.title, value: pct });
      }

      const activityHistoryRaw = await db
        .select({
          name: sql<string>`to_char(${materialProgress.createdAt}, 'Dy')`,
          value: sql<number>`count(*)::int`,
          date: sql<Date>`date_trunc('day', ${materialProgress.createdAt})`
        })
        .from(materialProgress)
        .where(sql`${materialProgress.studentId} = ${id as string} AND ${materialProgress.createdAt} >= CURRENT_DATE - INTERVAL '6 days' AND ${materialProgress.isCompleted} = true`)
        .groupBy(sql`to_char(${materialProgress.createdAt}, 'Dy'), date_trunc('day', ${materialProgress.createdAt})`)
        .orderBy(sql`date_trunc('day', ${materialProgress.createdAt})`);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const activityHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const found = activityHistoryRaw.find(a => a.name === dayName);
        activityHistory.push({ name: dayName, value: found ? found.value : 0 });
      }

      const totalCourses = enrolledCoursesRes?.count || 0;
      const completedCourses = completedCoursesRes?.count || 0;
      const ongoingCourses = totalCourses - completedCourses;
      const learningTime = completedCourses * 12 + ongoingCourses * 4;

      stats = {
        totalCourses,
        completedCourses,
        ongoingCourses,
        learningTime,
        courseProgress,
        activityHistory
      };
    }

    return successResponse({ stats }, "Stats fetched successfully", 200);
  } catch (error) {
    console.error("Stats error:", error);
    return errorResponse("Internal server error", 500);
  }
}
