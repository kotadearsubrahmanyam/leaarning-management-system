import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentActivities, notifications, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";
import { z } from "zod";

const evaluateSchema = z.object({
  marks: z.number().min(0).max(10, "Marks must be between 0 and 10"),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = evaluateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation error", 400, result.error.flatten().fieldErrors);
    }

    const { marks } = result.data;
    const activityId = params.id;
    const teacherId = payload.id as string;

    const [activity] = await db.select().from(studentActivities).where(eq(studentActivities.id, activityId)).limit(1);
    if (!activity) return errorResponse("Activity not found", 404);
    if (activity.marks !== null) return errorResponse("Activity already evaluated by another faculty", 400);

    await db.update(studentActivities)
      .set({ 
        marks, 
        evaluatedBy: teacherId, 
        evaluatedAt: new Date() 
      })
      .where(eq(studentActivities.id, activityId));
      
    // Notify the student
    const [teacher] = await db.select({ name: users.name }).from(users).where(eq(users.id, teacherId)).limit(1);
    
    await db.insert(notifications).values({
      userId: activity.studentId,
      title: "Activity Evaluated",
      message: `Your activity "${activity.title}" has been evaluated by ${teacher?.name || 'a faculty member'}. You received ${marks}/10 marks.`,
      isRead: false,
    });

    return successResponse(null, "Activity evaluated successfully");
  } catch (error: any) {
    console.error("Evaluate activity error:", error);
    return errorResponse("Internal server error", 500);
  }
}
