export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { mentoringPlans, users } from "@/db/schema";
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
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const plans = await db.select({
      id: mentoringPlans.id,
      planContent: mentoringPlans.planContent,
      createdAt: mentoringPlans.createdAt,
      teacherName: users.name
    })
    .from(mentoringPlans)
    .leftJoin(users, eq(mentoringPlans.teacherId, users.id))
    .where(eq(mentoringPlans.studentId, payload.id as string))
    .orderBy(desc(mentoringPlans.createdAt));

    return successResponse({ plans }, "Fetched mentoring plans", 200);

  } catch (error: any) {
    console.error("Fetch Mentoring Plans error:", error);
    return errorResponse("Internal error", 500);
  }
}
