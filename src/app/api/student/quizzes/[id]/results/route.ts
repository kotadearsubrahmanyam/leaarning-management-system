import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions, quizSubmissions, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;
    const quizId = params.id;

    // Check if the student has a submission for this quiz
    const submission = await db.query.quizSubmissions.findFirst({
      where: and(
        eq(quizSubmissions.quizId, quizId),
        eq(quizSubmissions.userId, userId)
      )
    });

    if (!submission) {
      return errorResponse("You have not submitted this quiz yet.", 400);
    }

    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return errorResponse("Quiz not found", 404);

    const course = await db.query.courses.findFirst({ where: eq(courses.id, quiz.courseId) });
    const courseName = course ? course.title : "Unknown Course";

    const questions = await db.query.quizQuestions.findMany({ where: eq(quizQuestions.quizId, quizId) });

    const parsedQuestions = await Promise.all(questions.map(async (q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch (e) {
        parsedOptions = [];
      }

      let explanation = q.explanation;
      if (!explanation && process.env.GROQ_API_KEY) {
        try {
          const systemInstruction = `You are an expert professor.
Generate a detailed, beginner-friendly educational explanation for the following multiple-choice question.

Question: "${q.question}"
Options: ${JSON.stringify(parsedOptions)}
Correct Answer: "${q.correctAnswer}"

Requirements:
- Minimum 3-5 sentences.
- Educational, clear, and beginner-friendly.
- Explain WHY the correct answer is right.
- Mention WHY common wrong options are incorrect.
- Help students learn from their mistakes.
- Output ONLY the explanation text. No JSON wrapper, no intro ("Sure, here is"), no markdown header. Just the explanation paragraph.`;

          const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "system", content: systemInstruction }],
              temperature: 0.3
            })
          });

          if (aiRes.ok) {
            const groqData = await aiRes.json();
            if (groqData && groqData.choices?.[0]?.message?.content) {
              explanation = groqData.choices[0].message.content.trim();
              // Save explanation back to database
              await db.update(quizQuestions)
                .set({ explanation })
                .where(eq(quizQuestions.id, q.id));
            }
          }
        } catch (e) {
          console.error(`Failed to generate explanation for question ${q.id}:`, e);
        }
      }

      return {
        id: q.id,
        question: q.question,
        options: parsedOptions,
        correctAnswer: q.correctAnswer,
        explanation: explanation || `The correct answer is "${q.correctAnswer}". It is the standard concept related to this question.`
      };
    }));

    let studentAnswers = {};
    try {
      studentAnswers = JSON.parse(submission.answers || "{}");
    } catch (e) {
      studentAnswers = {};
    }

    return successResponse({
      quizTitle: quiz.title,
      courseName,
      totalQuestions: questions.length,
      score: submission.score,
      totalPoints: submission.totalPoints,
      isMalpractice: submission.isMalpractice,
      timeTaken: submission.timeTaken,
      submissionDate: submission.createdAt,
      answers: studentAnswers,
      questions: parsedQuestions
    }, "Quiz results fetched successfully", 200);

  } catch (error: any) {
    console.error("Fetch Quiz Results error:", error);
    return errorResponse("Internal server error", 500);
  }
}
