import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, like } from "drizzle-orm";

const DEFAULT_TIMETABLE = {
  Monday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Tuesday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Wednesday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Thursday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
  Friday: {
    slot1: { name: "Free Period", faculty: "-" },
    slot2: { name: "Free Period", faculty: "-" },
    slot3: { name: "Free Period", faculty: "-" },
    lunch: { name: "Lunch Break", faculty: "-" },
    slot4: { name: "Free Period", faculty: "-" },
    slot5: { name: "Free Period", faculty: "-" },
  },
};

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.id as string) });
    if (!user) return errorResponse("User not found", 404);

    const teacherName = user.name;

    // Fetch all timetables
    const allSettings = await db.select().from(systemSettings).where(like(systemSettings.key, "WEEKLY_TIMETABLE_%"));

    // Deep clone the default timetable
    const teacherTimetable: any = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));

    for (const setting of allSettings) {
      let data;
      try {
        data = JSON.parse(setting.value || "{}");
      } catch (e) {
        continue;
      }
      
      const grid = data.timetable || data;
      const semesterMatch = setting.key.match(/\d+/);
      const semester = semesterMatch ? semesterMatch[0] : "?";

      for (const day of Object.keys(grid)) {
        if (!teacherTimetable[day]) continue;
        
        for (const slotId of Object.keys(grid[day])) {
          if (slotId === "lunch") continue;

          const cell = grid[day][slotId];
          if (cell && cell.faculty === teacherName) {
            // Overwrite the slot in the teacher's timetable
            // If there's a conflict, it will just overwrite with the last found one.
            teacherTimetable[day][slotId] = {
              name: `${cell.name} (Sem ${semester})`,
              faculty: teacherName,
              isCustom: false
            };
          }
        }
      }
    }

    return successResponse({ timetable: teacherTimetable, teacherName }, "Fetched teacher timetable successfully");
  } catch (error) {
    console.error("Teacher Timetable GET Error:", error);
    return errorResponse("Internal error", 500);
  }
}
