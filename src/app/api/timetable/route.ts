import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    let semester = searchParams.get("semester");

    // If no semester is provided, fetch the user's semester
    if (!semester) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id as string),
        columns: { semester: true }
      });
      semester = (user?.semester || 1).toString();
    }

    const settingKey = `WEEKLY_TIMETABLE_${semester}`;

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, settingKey),
    });

    if (!setting) {
      return successResponse({ timetable: null }, "No timetable found");
    }

    let timetableData = JSON.parse(setting.value);

    // Normalize old format vs new format
    if (!timetableData.timetable) {
      // It's the old flat format
      timetableData = { timetable: timetableData };
    }

    // Lazy Reversion Logic
    if (timetableData.isTemporary && timetableData.expiresAt) {
      if (new Date() > new Date(timetableData.expiresAt)) {
        // Expired! Revert to original
        timetableData = {
          timetable: timetableData.originalTimetable || timetableData.timetable
        };
        
        // Update DB silently
        await db.update(systemSettings)
          .set({ value: JSON.stringify(timetableData), updatedAt: new Date() })
          .where(eq(systemSettings.id, setting.id));
      }
    }

    return successResponse({ ...timetableData, semester }, "Fetched weekly timetable");
  } catch (error) {
    console.error("GET Timetable Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
