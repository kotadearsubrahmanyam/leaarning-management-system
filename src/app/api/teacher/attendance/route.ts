import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, enrollments, users, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!courseId || !dateStr) return errorResponse("Missing courseId or date", 400);

    const date = new Date(dateStr);
    
    // Check ownership
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (course?.teacherId !== payload.id) return errorResponse("Forbidden", 403);

    // Get enrolled students
    const enrolledStudents = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.courseId, courseId));

    // Get existing attendance for this date
    const attendanceRecords = await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.courseId, courseId),
          sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${date.toISOString()}::timestamp)`
        )
      );

    const data = enrolledStudents.map(student => {
      const record = attendanceRecords.find(a => a.userId === student.id);
      return {
        ...student,
        status: record ? record.status : null,
      };
    });

    return successResponse({ attendance: data }, "Fetched attendance successfully", 200);
  } catch (error) {
    console.error("Attendance GET Error", error);
    return errorResponse("Internal error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { courseId, date, records } = body; // records: { userId, status }[]

    if (!courseId || !date || !records) return errorResponse("Missing fields", 400);

    const targetDate = new Date(date);

    // Check if attendance is already saved for this course on this date
    const existingCheck = await db.select().from(attendance).where(
      and(
        eq(attendance.courseId, courseId),
        sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${targetDate.toISOString()}::timestamp)`
      )
    ).limit(1);

    if (existingCheck.length > 0) {
      return errorResponse("Attendance for this course has already been saved for today. You cannot modify it for 24 hours.", 403);
    }

    // Insert attendance
    for (const record of records) {
      await db.insert(attendance).values({
        courseId,
        userId: record.userId,
        date: targetDate,
        status: record.status,
      });
    }

    return successResponse(null, "Attendance saved successfully", 200);
  } catch (error) {
    console.error("Attendance POST Error", error);
    return errorResponse("Internal error", 500);
  }
}
