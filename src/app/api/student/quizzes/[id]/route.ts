import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const quizId = params.id;

    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return errorResponse("Quiz not found", 404);

    const questions = await db.query.quizQuestions.findMany({ where: eq(quizQuestions.quizId, quizId) });
    
    // Strip correct answers
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options),
      points: q.points
    }));

    return successResponse({ quiz: { ...quiz, questions: sanitizedQuestions } }, "Quiz fetched successfully", 200);

  } catch (error: any) {
    console.error("Fetch Quiz error:", error);
    return errorResponse("Internal error", 500);
  }
}
