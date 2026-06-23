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

    // Fetch recent enrollments
    const recentEnrollments = await db
      .select({
        id: enrollments.id,
        courseTitle: courses.title,
        timestamp: enrollments.createdAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, userId))
      .orderBy(desc(enrollments.createdAt))
      .limit(10);

    // Fetch recent material completions
    const recentCompletions = await db
      .select({
        id: materialProgress.id,
        lessonTitle: materials.title,
        courseTitle: courses.title,
        timestamp: materialProgress.createdAt,
      })
      .from(materialProgress)
      .innerJoin(materials, eq(materialProgress.materialId, materials.id))
      .innerJoin(courses, eq(materials.courseId, courses.id))
      .where(
        and(
          eq(materialProgress.studentId, userId),
          eq(materialProgress.isCompleted, true)
        )
      )
      .orderBy(desc(materialProgress.createdAt))
      .limit(10);

    // Format and combine
    const formattedEnrollments = recentEnrollments.map((e) => ({
      id: `enroll-${e.id}`,
      type: "ENROLLMENT",
      title: "Enrolled in Course",
      subtitle: e.courseTitle,
      timestamp: e.timestamp,
    }));

    const formattedCompletions = recentCompletions.map((c) => ({
      id: `complete-${c.id}`,
      type: "LESSON_COMPLETED",
      title: `Completed: ${c.lessonTitle}`,
      subtitle: c.courseTitle,
      timestamp: c.timestamp,
    }));

    const combinedActivity = [...formattedEnrollments, ...formattedCompletions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return successResponse({ activity: combinedActivity }, "Fetched activity successfully", 200);
  } catch (error) {
    console.error("Fetch activity error:", error);
    return errorResponse("Internal server error", 500);
  }
}
