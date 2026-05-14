import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, notifications } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, isNull, eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Forbidden", 403);

    // Fetch Global Chat Messages (receiverId is null)
    const data = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(isNull(messages.receiverId))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    // Reverse to ascending order for chat UI
    return successResponse({ messages: data.reverse() }, "Fetched global messages");
  } catch (error) {
    console.error("Fetch global messages error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { content } = body;

    if (!content) return errorResponse("Missing message content", 400);

    const [message] = await db.insert(messages).values({
      senderId: payload.id as string,
      receiverId: null, // Global message
      content,
    }).returning();

    // Create notifications for everyone else
    const allUsers = await db.select({ id: users.id }).from(users);
    const notificationsToInsert = allUsers
      .filter(u => u.id !== payload.id)
      .map(u => ({
        userId: u.id,
        title: "New Global Message",
        message: `${payload.name} posted: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
      }));

    if (notificationsToInsert.length > 0) {
      await db.insert(notifications).values(notificationsToInsert);
    }

    return successResponse({ message }, "Global message sent");
  } catch (error) {
    console.error("Send global message error:", error);
    return errorResponse("Internal server error", 500);
  }
}
