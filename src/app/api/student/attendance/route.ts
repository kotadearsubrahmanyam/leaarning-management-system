import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, courses, enrollments, classSessions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);
    const studentId = payload.id as string;

    const data = await db
      .select({
        id: attendance.id,
        sessionId: attendance.sessionId,
        date: classSessions.date,
        startTime: classSessions.startTime,
        endTime: classSessions.endTime,
        sessionType: classSessions.sessionType,
        status: attendance.status,
        courseId: classSessions.courseId,
        courseName: courses.title,
      })
      .from(attendance)
      .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(classSessions.date));

    // Get all enrolled courses
    const studentEnrollments = await db
      .select({
        courseId: enrollments.courseId,
        courseName: courses.title,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId));

    const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Fetch all today's sessions for these courses
    let todaySessions: any[] = [];
    if (enrolledCourseIds.length > 0) {
      todaySessions = await db.select({
        id: classSessions.id,
        courseId: classSessions.courseId,
        courseName: courses.title,
        date: classSessions.date,
        startTime: classSessions.startTime,
        endTime: classSessions.endTime,
        sessionType: classSessions.sessionType,
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(
        and(
          inArray(classSessions.courseId, enrolledCourseIds),
          sql`${classSessions.date}::date = ${todayStr}::date`
        )
      );
    }

    const enrichedData = [...data];

    // Add default absent for today's sessions if not marked
    for (const session of todaySessions) {
      const hasRecord = data.some(a => a.sessionId === session.id);
      if (!hasRecord) {
        enrichedData.unshift({
          id: `synthetic-${session.id}`,
          sessionId: session.id,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          sessionType: session.sessionType,
          status: "ABSENT", // default as absent per user request
          courseId: session.courseId,
          courseName: session.courseName,
        });
      }
    }

    // sort again by date descending, then by start time
    enrichedData.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (b.startTime || "").localeCompare(a.startTime || "");
    });

    return successResponse({ attendance: enrichedData }, "Fetched attendance successfully");
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return errorResponse("Internal server error", 500);
  }
}
