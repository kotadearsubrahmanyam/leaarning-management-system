import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, enrollments, materials, materialProgress } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const createMaterialSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  fileUrl: z.string().url("Must be a valid URL"),
  fileType: z.string(),
  size: z.string(),
  category: z.string().default("REFERENCE_MATERIALS"),
});

// GET all materials for a course
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Self-healing migration: Ensure "category" column exists in Material table
    try {
      await db.execute(sql`
        ALTER TABLE "Material" 
        ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT 'REFERENCE_MATERIALS';
      `);
    } catch (e) {
      console.warn("Material.category migration skipped or already applied:", e);
    }

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const courseId = params.id;
    const userId = payload.id as string;
    const role = payload.role as string;

    // Verify access: Is teacher of course OR is enrolled student OR is admin
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    
    if (!course) return errorResponse("Course not found", 404);

    let hasAccess = false;

    if (role === "ADMIN" || (role === "TEACHER" && course.teacherId === userId)) {
      hasAccess = true;
    } else if (role === "STUDENT") {
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.courseId, courseId), eq(enrollments.studentId, userId)))
        .limit(1);
      
      if (enrollment) hasAccess = true;
    }

    if (!hasAccess) {
      return errorResponse("Forbidden. You must be enrolled to view materials.", 403);
    }

    let courseMaterials: any[];

    if (role === "STUDENT") {
      const result = await db
        .select({
          material: materials,
          progress: materialProgress,
        })
        .from(materials)
        .leftJoin(
          materialProgress,
          and(
            eq(materials.id, materialProgress.materialId),
            eq(materialProgress.studentId, userId)
          )
        )
        .where(eq(materials.courseId, courseId));

      courseMaterials = result.map(row => ({
        ...row.material,
        isCompleted: !!row.progress?.isCompleted,
      }));
    } else {
      courseMaterials = await db
        .select()
        .from(materials)
        .where(eq(materials.courseId, courseId));
    }

    return successResponse({ materials: courseMaterials }, "Materials fetched successfully", 200);
  } catch (error) {
    console.error("Fetch materials error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST new material metadata
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    if (payload.role !== "TEACHER" && payload.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const courseId = params.id;
    const userId = payload.id as string;

    // Verify ownership
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) return errorResponse("Course not found", 404);
    if (payload.role === "TEACHER" && course.teacherId !== userId) {
      return errorResponse("Forbidden. You do not own this course.", 403);
    }

    const body = await req.json();
    const result = createMaterialSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, result.error.flatten().fieldErrors);
    }

    const newMaterial = await db
      .insert(materials)
      .values({
        ...result.data,
        courseId,
      })
      .returning();

    return successResponse({ material: newMaterial[0] }, "Material added successfully", 201);
  } catch (error) {
    console.error("Create material error:", error);
    return errorResponse("Internal server error", 500);
  }
}
