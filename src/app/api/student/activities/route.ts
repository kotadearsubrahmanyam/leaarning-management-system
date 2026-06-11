import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentActivities } from "@/db/schema";
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
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const data = await db
      .select()
      .from(studentActivities)
      .where(eq(studentActivities.studentId, payload.id as string))
      .orderBy(desc(studentActivities.date));

    return successResponse({ activities: data }, "Fetched activities successfully");
  } catch (error) {
    console.error("Fetch activities error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { title, type, description, proofUrl, date } = body;

    if (!title || !type || !date) {
      return errorResponse("Missing required fields", 400);
    }

    const [newActivity] = await db.insert(studentActivities).values({
      studentId: payload.id as string,
      title,
      type,
      description,
      proofUrl,
      date: new Date(date),
    }).returning();

    return successResponse({ activity: newActivity }, "Activity logged successfully", 201);
  } catch (error) {
    console.error("Create activity error:", error);
    return errorResponse("Internal server error", 500);
  }
}
