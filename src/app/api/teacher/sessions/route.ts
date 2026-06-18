import { NextResponse } from "next/server";
import { db } from "@/db";
import { classSessions, courses, courseFaculty, schedule } from "@/db/schema";
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

    if (!courseId || !dateStr) {
      return errorResponse("Missing courseId or date", 400);
    }

    const dateObj = new Date(dateStr);

    // Check course ownership
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

    // Fetch existing sessions
    const existingSessions = await db.select()
      .from(classSessions)
      .where(
        and(
          eq(classSessions.courseId, courseId),
          sql`${classSessions.date}::date = ${dateStr}::date`
        )
      );

    // Fetch schedules/timetable slots
    const schedules = await db.select()
      .from(schedule)
      .where(
        and(
          eq(schedule.courseId, courseId),
          sql`${schedule.date}::date = ${dateStr}::date`
        )
      );

    // Auto-create sessions from timetable schedules if not already present
    for (const sched of schedules) {
      const match = existingSessions.find(
        (s) => s.startTime === sched.time && s.facultyId === sched.teacherId
      );
      if (!match) {
        // Auto-calculate end time 1 hour after start time
        let endTimeStr = "10:00";
        try {
          const [hoursStr, minutesStr] = sched.time.split(":");
          const hours = parseInt(hoursStr, 10);
          const nextHour = (hours + 1) % 24;
          endTimeStr = `${String(nextHour).padStart(2, "0")}:${minutesStr || "00"}`;
        } catch (e) {
          // fallback
        }

        const [newSession] = await db.insert(classSessions).values({
          courseId,
          facultyId: sched.teacherId,
          sectionId: "CSE-A", // default section
          date: dateObj,
          startTime: sched.time,
          endTime: endTimeStr,
          sessionType: "LECTURE", // default type for timetable
        }).returning();

        existingSessions.push(newSession);
      }
    }

    return successResponse({ sessions: existingSessions }, "Fetched sessions successfully");
  } catch (error) {
    console.error("GET sessions error:", error);
    return errorResponse("Internal server error", 500);
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
    const { courseId, date, startTime, endTime, sessionType, sectionId } = body;

    if (!courseId || !date || !startTime || !endTime || !sessionType || !sectionId) {
      return errorResponse("Missing required fields", 400);
    }

    // Check course ownership
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

    const [newSession] = await db.insert(classSessions).values({
      courseId,
      facultyId: payload.id as string,
      sectionId,
      date: new Date(date),
      startTime,
      endTime,
      sessionType,
    }).returning();

    return successResponse({ session: newSession }, "Session created successfully", 201);
  } catch (error) {
    console.error("Create session error:", error);
    return errorResponse("Internal server error", 500);
  }
}
