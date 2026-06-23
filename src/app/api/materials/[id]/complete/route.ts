export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialProgress, materials, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const materialId = params.id;
    const studentId = payload.id as string;

    // Check if progress already exists
    const existingProgress = await db
      .select()
      .from(materialProgress)
      .where(
        and(
          eq(materialProgress.studentId, studentId),
          eq(materialProgress.materialId, materialId)
        )
      )
      .limit(1);

    let isCompleted = true;

    if (existingProgress.length > 0) {
      // Toggle
      isCompleted = !existingProgress[0].isCompleted;
      await db
        .update(materialProgress)
        .set({ isCompleted })
        .where(eq(materialProgress.id, existingProgress[0].id));
    } else {
      // Insert
      await db.insert(materialProgress).values({
        studentId,
        materialId,
        isCompleted: true,
      });
    }

    // Now check if all materials for this course are completed
    // First find the courseId
    const materialData = await db
      .select({ courseId: materials.courseId })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (materialData.length > 0) {
      const courseId = materialData[0].courseId;

      // Get all materials for the course
      const allMaterials = await db
        .select({ id: materials.id })
        .from(materials)
        .where(eq(materials.courseId, courseId));

      // Get all completed progress for this student and these materials
      const completedProgress = await db
        .select({ materialId: materialProgress.materialId })
        .from(materialProgress)
        .innerJoin(materials, eq(materialProgress.materialId, materials.id))
        .where(
          and(
            eq(materialProgress.studentId, studentId),
            eq(materials.courseId, courseId),
            eq(materialProgress.isCompleted, true)
          )
        );

      // If count matches, mark course as completed
      if (allMaterials.length > 0 && allMaterials.length === completedProgress.length) {
        await db
          .update(enrollments)
          .set({ status: "COMPLETED" })
          .where(
            and(
              eq(enrollments.studentId, studentId),
              eq(enrollments.courseId, courseId)
            )
          );
      }
    }

    return successResponse({ isCompleted }, "Material progress updated", 200);
  } catch (error) {
    console.error("Material complete error:", error);
    return errorResponse("Internal server error", 500);
  }
}
