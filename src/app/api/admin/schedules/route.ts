import { NextResponse } from "next/server";
import { db } from "@/db";
import { schedule, courses, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    // Allow anyone in the dashboard to see schedules, but maybe filter by user later. For now, return all.
    if (!payload) return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: schedule.id,
        date: schedule.date,
        time: schedule.time,
        courseName: courses.title,
        teacherName: users.name,
      })
      .from(schedule)
      .innerJoin(courses, eq(schedule.courseId, courses.id))
      .innerJoin(users, eq(schedule.teacherId, users.id))
      .orderBy(desc(schedule.date));

    return successResponse({ schedules: data }, "Fetched schedules successfully");
  } catch (error) {
    console.error("Fetch schedules error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { courseId, teacherId, date, time } = body;

    if (!courseId || !teacherId || !date || !time) {
      return errorResponse("Missing required fields", 400);
    }

    const [newSchedule] = await db.insert(schedule).values({
      courseId,
      teacherId,
      date: new Date(date),
      time,
    }).returning();

    return successResponse({ schedule: newSchedule }, "Schedule created successfully");
  } catch (error) {
    console.error("Create schedule error:", error);
    return errorResponse("Internal server error", 500);
  }
}
