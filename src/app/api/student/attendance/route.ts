import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, courses, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

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
        date: attendance.date,
        status: attendance.status,
        courseId: attendance.courseId,
        courseName: courses.title,
      })
      .from(attendance)
      .innerJoin(courses, eq(attendance.courseId, courses.id))
      .where(eq(attendance.userId, studentId))
      .orderBy(desc(attendance.date));

    // Get all enrolled courses
    const studentEnrollments = await db
      .select({
        courseId: enrollments.courseId,
        courseName: courses.title,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = data.filter(a => {
      const aDate = new Date(a.date);
      aDate.setHours(0, 0, 0, 0);
      return aDate.getTime() === today.getTime();
    });

    const enrichedData = [...data];

    // Add default absent for today if not marked
    for (const enrollment of studentEnrollments) {
      const hasToday = todayAttendance.some(a => a.courseId === enrollment.courseId);
      if (!hasToday) {
        enrichedData.unshift({
          id: `synthetic-${enrollment.courseId}`,
          date: today,
          status: "ABSENT", // default as absent per user request
          courseId: enrollment.courseId,
          courseName: enrollment.courseName,
        });
      }
    }

    // sort again by date descending
    enrichedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return successResponse({ attendance: enrichedData }, "Fetched attendance successfully");
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return errorResponse("Internal server error", 500);
  }
}
