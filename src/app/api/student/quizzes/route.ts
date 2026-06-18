import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, enrollments, quizSubmissions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, inArray, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;

    // Get courses student is enrolled in
    const enrolled = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, userId)
    });
    
    const courseIds = enrolled.map(e => e.courseId);

    if (courseIds.length === 0) {
      return successResponse({ quizzes: [] }, "Fetched quizzes", 200);
    }

    const availableQuizzes = await db.query.quizzes.findMany({
      where: and(
        inArray(quizzes.courseId, courseIds),
        eq(quizzes.status, "PUBLISHED")
      ),
      orderBy: desc(quizzes.createdAt)
    });

    const submissions = await db.query.quizSubmissions.findMany({
      where: eq(quizSubmissions.userId, userId)
    });

    const enrichedQuizzes = availableQuizzes.map(q => {
      const sub = submissions.find(s => s.quizId === q.id);
      return {
        ...q,
        isCompleted: !!sub,
        score: sub ? sub.score : null,
        totalPoints: sub ? sub.totalPoints : null,
        isMalpractice: sub ? sub.isMalpractice : false
      };
    });

    return successResponse({ quizzes: enrichedQuizzes }, "Fetched quizzes", 200);

  } catch (error: any) {
    console.error("Fetch Quizzes error:", error);
    return errorResponse("Internal error", 500);
  }
}
