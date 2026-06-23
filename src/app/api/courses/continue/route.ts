export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, enrollments, materials, materialProgress } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    if (payload.role !== "STUDENT") {
      return errorResponse("Forbidden", 403);
    }

    const userId = payload.id as string;
    let targetCourseId: string | null = null;
    let lastLessonTitle = "Getting Started";

    // 1. Try to find the most recently interacted material
    const latestProgress = await db
      .select({
        materialId: materialProgress.materialId,
        courseId: materials.courseId,
        title: materials.title,
      })
      .from(materialProgress)
      .innerJoin(materials, eq(materialProgress.materialId, materials.id))
      .where(eq(materialProgress.studentId, userId))
      .orderBy(desc(materialProgress.createdAt))
      .limit(1);

    if (latestProgress.length > 0) {
      targetCourseId = latestProgress[0].courseId;
      lastLessonTitle = latestProgress[0].title;
    } else {
      // 2. Fallback to the most recent active enrollment
      const latestEnrollment = await db
        .select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, userId),
            eq(enrollments.status, "ACTIVE")
          )
        )
        .orderBy(desc(enrollments.createdAt))
        .limit(1);

      if (latestEnrollment.length > 0) {
        targetCourseId = latestEnrollment[0].courseId;
      }
    }

    if (!targetCourseId) {
      return successResponse({ continueCourse: null }, "No active courses found", 200);
    }

    // 3. Fetch Course details
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        imageUrl: courses.imageUrl,
      })
      .from(courses)
      .where(eq(courses.id, targetCourseId))
      .limit(1);

    if (!course) {
      return successResponse({ continueCourse: null }, "Course not found", 200);
    }

    // 4. Calculate progress
    const allMaterials = await db
      .select({ id: materials.id, title: materials.title })
      .from(materials)
      .where(eq(materials.courseId, targetCourseId))
      .orderBy(materials.createdAt);

    const completedProgress = await db
      .select({ materialId: materialProgress.materialId })
      .from(materialProgress)
      .innerJoin(materials, eq(materialProgress.materialId, materials.id))
      .where(
        and(
          eq(materialProgress.studentId, userId),
          eq(materials.courseId, targetCourseId),
          eq(materialProgress.isCompleted, true)
        )
      );

    const totalMaterials = allMaterials.length;
    const completedCount = completedProgress.length;
    let progressPercentage = 0;

    if (totalMaterials > 0) {
      progressPercentage = Math.round((completedCount / totalMaterials) * 100);
      
      // If no progress, set last lesson to the first material
      if (completedCount === 0 && allMaterials.length > 0) {
        lastLessonTitle = allMaterials[0].title;
      }
    }

    const continueCourse = {
      id: course.id,
      title: course.title,
      imageUrl: course.imageUrl,
      lastLesson: lastLessonTitle,
      progress: progressPercentage,
      completedCount,
      totalCount: totalMaterials,
    };

    return successResponse({ continueCourse }, "Fetched continue learning course", 200);
  } catch (error) {
    console.error("Fetch continue course error:", error);
    return errorResponse("Internal server error", 500);
  }
}
