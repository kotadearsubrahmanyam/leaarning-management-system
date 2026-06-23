export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentLearningPaths, learningPaths, courses, users, learningPathResources } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const studentId = payload.id as string;

    const data = await db.select({
      id: studentLearningPaths.id,
      progress: studentLearningPaths.progress,
      assignedDate: studentLearningPaths.assignedDate,
      completionStatus: studentLearningPaths.completionStatus,
      readinessScore: studentLearningPaths.readinessScore,
      learningPathId: learningPaths.id,
      title: learningPaths.title,
      description: learningPaths.description,
      prerequisites: learningPaths.prerequisites,
      studySequence: learningPaths.studySequence,
      resources: learningPaths.resources,
      mockTests: learningPaths.mockTests,
      courseId: courses.id,
      courseTitle: courses.title,
      teacherName: users.name,
    })
    .from(studentLearningPaths)
    .innerJoin(learningPaths, eq(studentLearningPaths.learningPathId, learningPaths.id))
    .innerJoin(courses, eq(learningPaths.courseId, courses.id))
    .leftJoin(users, eq(courses.teacherId, users.id))
    .where(eq(studentLearningPaths.studentId, studentId));

    const enrichedData = await Promise.all(data.map(async (row) => {
      const resList = await db.query.learningPathResources.findMany({
        where: eq(learningPathResources.learningPathId, row.learningPathId),
        orderBy: (res, { asc }) => [asc(res.sequenceOrder)],
      });
      return {
        ...row,
        resourcesList: resList,
      };
    }));

    return successResponse({ learningPaths: enrichedData }, "Fetched assigned learning paths");
  } catch (error) {
    console.error("GET Student Learning Paths Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
