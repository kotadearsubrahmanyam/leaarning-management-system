export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings, notifications, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { timetable, isTemporary, semester = 1 } = await req.json();
    if (!timetable) return errorResponse("Timetable data is required", 400);
    if (typeof semester !== "number" || semester < 1 || semester > 8) {
      return errorResponse("Invalid semester", 400);
    }

    const settingKey = `WEEKLY_TIMETABLE_${semester}`;

    // Fetch existing setting to act as originalTimetable if temporary
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, settingKey),
    });

    let payloadToSave: any = { timetable };

    if (isTemporary) {
      let originalTimetable = timetable; // fallback
      if (existing) {
        const parsed = JSON.parse(existing.value);
        // If already temporary, keep the original originalTimetable
        originalTimetable = parsed.originalTimetable || parsed.timetable;
      }
      
      payloadToSave = {
        timetable,
        isTemporary: true,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        originalTimetable,
      };
    }

    const jsonString = JSON.stringify(payloadToSave);

    // Save timetable to SystemSettings

    if (existing) {
      await db.update(systemSettings)
        .set({ value: jsonString, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing.id));
    } else {
      await db.insert(systemSettings).values({
        key: settingKey,
        value: jsonString,
      });
    }

    // Broadcast notification to specific students
    const semesterStudents = await db.query.users.findMany({
      where: (users, { and, eq }) => and(
        eq(users.role, "STUDENT"),
        eq(users.semester, semester)
      ),
    });

    if (semesterStudents.length > 0) {
      const notificationsToInsert = semesterStudents.map(student => ({
        userId: student.id,
        title: "Timetable Updated",
        message: `The weekly timetable for Semester ${semester} has been updated. Please check your dashboard to review the changes.`,
        type: "SYSTEM",
      }));

      await db.insert(notifications).values(notificationsToInsert);
    }

    return successResponse(null, "Timetable saved and notifications broadcast successfully");
  } catch (error) {
    console.error("POST Timetable Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
