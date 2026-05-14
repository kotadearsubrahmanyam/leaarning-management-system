import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, payload.id as string))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return successResponse({ notifications: userNotifications }, "Fetched notifications", 200);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
    } else {
      // Mark all as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, payload.id as string));
    }

    return successResponse(null, "Notifications updated", 200);
  } catch (error) {
    console.error("Update notifications error:", error);
    return errorResponse("Internal server error", 500);
  }
}
