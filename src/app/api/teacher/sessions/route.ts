import { NextResponse } from "next/server";
import { db } from "@/db";
import { classSessions, courses, courseFaculty, systemSettings } from "@/db/schema";
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
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
    
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.key, `WEEKLY_TIMETABLE_${course.semester}`));
    
    let timetable: any = null;
    if (settings.length > 0) {
      try {
        const parsed = JSON.parse(settings[0].value || "{}");
        timetable = parsed.timetable || parsed;
      } catch(e) {}
    }

    const TIME_SLOTS: Record<string, { start: string, end: string }> = {
      "slot1": { start: "09:30", end: "10:30" },
      "slot2": { start: "10:30", end: "11:30" },
      "slot3": { start: "11:30", end: "12:30" },
      "slot4": { start: "13:30", end: "14:30" },
      "slot5": { start: "14:30", end: "15:30" },
    };

    if (timetable && timetable[dayOfWeek]) {
      const daySchedule = timetable[dayOfWeek];
      for (const slotId of Object.keys(daySchedule)) {
        if (slotId === "lunch") continue;
        const cell = daySchedule[slotId];
        
        if (cell && cell.name === course.title && TIME_SLOTS[slotId]) {
          const slotTimes = TIME_SLOTS[slotId];
          
          const match = existingSessions.find(
            (s) => s.startTime === slotTimes.start && s.endTime === slotTimes.end
          );
          
          if (!match) {
            const [newSession] = await db.insert(classSessions).values({
              courseId,
              facultyId: payload.id as string,
              sectionId: "CSE-A", // default section
              date: dateObj,
              startTime: slotTimes.start,
              endTime: slotTimes.end,
              sessionType: "LECTURE",
            }).returning();

            existingSessions.push(newSession);
          }
        }
      }
    }

    return successResponse({ sessions: existingSessions }, "Fetched sessions successfully");
  } catch (error) {
    console.error("GET sessions error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  return errorResponse("Manual session creation is disabled. Sessions are strictly generated from the Timetable.", 403);
}
