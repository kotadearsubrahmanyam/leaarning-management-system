export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { teacherId } = body;

    if (!teacherId) {
      return errorResponse("Teacher ID is required", 400);
    }

    const courseId = params.id;

    // Verify course exists
    const existing = await db.query.courses.findFirst({
      where: eq(courses.id, courseId)
    });

    if (!existing) {
      return errorResponse("Course not found", 404);
    }

    // Update teacherId
    const updated = await db.update(courses)
      .set({ teacherId })
      .where(eq(courses.id, courseId))
      .returning();

    return successResponse({ course: updated[0] }, "Course reassigned successfully", 200);

  } catch (error: any) {
    console.error("Course reassignment error:", error);
    return errorResponse("Internal error", 500);
  }
}
