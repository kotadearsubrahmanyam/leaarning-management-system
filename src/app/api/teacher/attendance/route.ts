export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, enrollments, users, courses, courseFaculty, classSessions } from "@/db/schema";
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
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) return errorResponse("Missing sessionId", 400);

    const session = await db.query.classSessions.findFirst({ where: eq(classSessions.id, sessionId) });
    if (!session) return errorResponse("Session not found", 404);

    const courseId = session.courseId;
    
    // Check ownership
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (!course) return errorResponse("Course not found", 404);
    
    let isAuthorized = course.teacherId === payload.id;
    if (!isAuthorized) {
       const [coTeacher] = await db.select().from(courseFaculty).where(
         and(
           eq(courseFaculty.courseId, courseId),
           eq(courseFaculty.teacherId, payload.id as string)
         )
       );
       if (coTeacher) isAuthorized = true;
    }
    
    if (!isAuthorized) return errorResponse("Forbidden", 403);

    // Get enrolled students
    const enrolledStudents = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      rollNumber: users.rollNumber,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.courseId, courseId));

    // Get existing attendance for this session
    const attendanceRecords = await db.select()
      .from(attendance)
      .where(eq(attendance.sessionId, sessionId));

    const data = enrolledStudents.map(student => {
      const record = attendanceRecords.find(a => a.studentId === student.id);
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
    const { sessionId, records } = body; // records: { studentId/userId, status }[]

    if (!sessionId || !records) return errorResponse("Missing fields", 400);

    const session = await db.query.classSessions.findFirst({ where: eq(classSessions.id, sessionId) });
    if (!session) return errorResponse("Session not found", 404);

    const courseId = session.courseId;

    // Check ownership
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (!course) return errorResponse("Course not found", 404);
    
    let isAuthorized = course.teacherId === payload.id;
    if (!isAuthorized) {
       const [coTeacher] = await db.select().from(courseFaculty).where(
         and(
           eq(courseFaculty.courseId, courseId),
           eq(courseFaculty.teacherId, payload.id as string)
         )
       );
       if (coTeacher) isAuthorized = true;
    }
    
    if (!isAuthorized) return errorResponse("Forbidden", 403);

    const targetDate = new Date(session.date);
    
    // Parse the start and end times string "HH:MM"
    const [startH, startM] = session.startTime.split(":").map(Number);
    const [endH, endM] = session.endTime.split(":").map(Number);
    
    const sessionStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), startH, startM, 0);
    const sessionEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), endH, endM, 0);
    const now = new Date();

    // Weekend Lockout (Sunday = 0)
    if (targetDate.getDay() === 0) {
      return errorResponse("Cannot mark attendance on a Sunday. Sundays are official holidays.", 400);
    }

    // STRICT TIMETABLE LOCKOUT
    if (now < sessionStart) {
      return errorResponse("Attendance is locked. The class session has not started yet.", 400);
    }
    
    if (now > sessionEnd) {
      return errorResponse("Attendance is locked. The time window for this class session has ended.", 400);
    }

    // Fetch existing attendance for this session to support upserts
    const existingRecords = await db.select().from(attendance).where(
      eq(attendance.sessionId, sessionId)
    );

    // Process attendance (Insert or Update)
    for (const record of records) {
      const studentId = record.studentId || record.userId;
      const existing = existingRecords.find(a => a.studentId === studentId);
      
      if (existing) {
        // Update existing record
        await db.update(attendance)
          .set({ 
            status: record.status,
            updatedBy: payload.id as string,
            updatedAt: new Date(),
          })
          .where(eq(attendance.id, existing.id));
      } else {
        // Insert new record
        await db.insert(attendance).values({
          studentId,
          sessionId,
          status: record.status,
          updatedBy: payload.id as string,
          updatedAt: new Date(),
        });
      }
    }

    return successResponse(null, "Attendance updated successfully", 200);
  } catch (error) {
    console.error("Attendance POST Error", error);
    return errorResponse("Internal error", 500);
  }
}
