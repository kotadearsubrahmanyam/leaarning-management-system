export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions, quizSubmissions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { quizId, answers, isMalpractice, timeTaken } = body;
    // answers is expected to be an object: { [questionId]: "Selected Option String" }

    if (!quizId) return errorResponse("quizId is required", 400);

    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return errorResponse("Quiz not found", 404);

    const questions = await db.query.quizQuestions.findMany({ where: eq(quizQuestions.quizId, quizId) });
    
    let score = 0;
    let totalPoints = 0;

    for (const q of questions) {
      totalPoints += q.points;
      const studentAnswer = answers?.[q.id];
      if (studentAnswer === q.correctAnswer) {
        score += q.points;
      }
    }

    // Force score to 0 if malpractice occurred
    if (isMalpractice) {
      score = 0;
    }

    const [submission] = await db.insert(quizSubmissions).values({
      quizId,
      userId: payload.id as string,
      score,
      totalPoints,
      answers: JSON.stringify(answers || {}),
      isMalpractice: isMalpractice || false,
      timeTaken: timeTaken || null
    }).returning();

    return successResponse({ score: submission.score, totalPoints: submission.totalPoints, isMalpractice: submission.isMalpractice }, "Quiz submitted successfully", 200);

  } catch (error: any) {
    console.error("Submit Quiz error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
