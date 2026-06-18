import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentLearningPaths, learningPaths } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const studentId = payload.id as string;
    const body = await req.json();
    const { studentLearningPathId, progress } = body;

    if (!studentLearningPathId || !progress) {
      return errorResponse("Missing required fields", 400);
    }

    // 1. Fetch student learning path record
    const slp = await db.query.studentLearningPaths.findFirst({
      where: and(
        eq(studentLearningPaths.id, studentLearningPathId),
        eq(studentLearningPaths.studentId, studentId)
      ),
      with: {
        learningPath: true,
      }
    });

    if (!slp) return errorResponse("Learning path progress record not found", 404);

    const lp = slp.learningPath;
    let totalUnits = 5;
    try {
      if (lp.studySequence) {
        const parsed = JSON.parse(lp.studySequence);
        if (Array.isArray(parsed)) totalUnits = parsed.length;
      }
    } catch(e) {}

    // Let's count totals for assignments, mock tests, checklist
    // To make it flexible, let's assume:
    // 5 units, 5 assignments, 2 mock tests, 5 checklist items
    const completedUnits = progress.completedUnits || [];
    const completedAssignments = progress.completedAssignments || [];
    const completedMockTests = progress.completedMockTests || [];
    const completedChecklist = progress.completedChecklist || [];

    const totalAssignments = 5;
    const totalMockTests = 2;
    const totalChecklist = 5;

    const totalCheckboxes = totalUnits + totalAssignments + totalMockTests + totalChecklist;
    const checkedCheckboxes = completedUnits.length + completedAssignments.length + completedMockTests.length + completedChecklist.length;
    
    const readinessScore = totalCheckboxes > 0 ? Math.min(100, Math.round((checkedCheckboxes / totalCheckboxes) * 100)) : 0;
    
    const updatedProgress = {
      completedUnits,
      completedAssignments,
      completedMockTests,
      completedChecklist,
      readinessScore
    };

    const completionStatus = readinessScore === 100 ? "COMPLETED" : "IN_PROGRESS";

    const [updated] = await db.update(studentLearningPaths)
      .set({
        progress: JSON.stringify(updatedProgress),
        completionStatus,
        readinessScore,
        updatedAt: new Date(),
      })
      .where(eq(studentLearningPaths.id, studentLearningPathId))
      .returning();

    return successResponse({ studentLearningPath: updated }, "Progress updated successfully");
  } catch (error) {
    console.error("POST Progress Update Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
