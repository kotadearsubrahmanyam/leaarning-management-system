export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, enrollments, attendance, classSessions, notifications, courseFaculty, results } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) return errorResponse("Missing courseId", 400);

    // Get enrolled students scoped to this teacher's section
    const enrolledStudents = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      rollNumber: users.rollNumber,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .innerJoin(courseFaculty, eq(enrollments.courseFacultyId, courseFaculty.id))
    .where(
      and(
        eq(enrollments.courseId, courseId),
        eq(courseFaculty.teacherId, payload.id as string)
      )
    );

    // Get progress and attendance for each student
    const progressData = await Promise.all(enrolledStudents.map(async (student) => {
      // Fetch detailed attendance records for history
      const attendanceRecords = await db.select({
        id: attendance.id,
        status: attendance.status,
        date: classSessions.date,
        startTime: classSessions.startTime,
        endTime: classSessions.endTime,
        sessionType: classSessions.sessionType,
      })
      .from(attendance)
      .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
      .where(and(
        eq(classSessions.courseId, courseId),
        eq(attendance.studentId, student.id)
      ));
      
      const totalClasses = attendanceRecords.length;
      const attendedClasses = attendanceRecords.filter(a => a.status === 'PRESENT').length;
      const attendancePct = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      // Sort history descending by date and start time
      const history = [...attendanceRecords].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.startTime.localeCompare(a.startTime);
      });

      // Check if student failed this specific course
      const failedRecord = await db.select()
        .from(results)
        .where(and(
          eq(results.userId, student.id),
          eq(results.courseId, courseId),
          eq(results.status, "FAIL")
        ))
        .limit(1);

      const hasFailedThisSubject = failedRecord.length > 0;

      return {
        ...student,
        attendancePct,
        totalClasses,
        attendedClasses,
        history,
        hasFailedThisSubject,
      };
    }));

    return successResponse({ progress: progressData }, "Fetched progress successfully", 200);
  } catch (error) {
    console.error("Progress GET Error", error);
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
    const { studentId, message, title } = body;

    if (!studentId || !message || !title) {
      return errorResponse("Missing studentId, message, or title", 400);
    }

    // Insert warning notification
    const [newNotification] = await db.insert(notifications).values({
      userId: studentId,
      title,
      message,
    }).returning();

    return successResponse({ notification: newNotification }, "Warning notification sent successfully", 201);
  } catch (error) {
    console.error("Progress POST Error", error);
    return errorResponse("Internal error", 500);
  }
}
