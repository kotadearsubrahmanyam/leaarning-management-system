export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;
    const originalQuizId = params.id;

    // Fetch original quiz
    const originalQuiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, originalQuizId) });
    if (!originalQuiz) return errorResponse("Original quiz not found", 404);

    const course = await db.query.courses.findFirst({ where: eq(courses.id, originalQuiz.courseId) });
    if (!course) return errorResponse("Course not found", 404);

    // Fetch original questions count to keep it consistent
    const originalQuestions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, originalQuizId)
    });
    const count = originalQuestions.length || 10;

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    // Generate fresh questions via GROQ
    const systemInstruction = `You are an expert professor. The course topic is "${course.title}".
Generate exactly ${count} multiple-choice questions for a practice quiz.
    
You must output ONLY valid JSON in the exact following format:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "A short, 2-4 lines beginner-friendly, educational explanation of why the correct answer is right and why it is important."
    }
  ]
}
Requirements:
1. "options" must be an array of exactly 4 strings.
2. "correctAnswer" must be identical to one of the 4 options.
3. "explanation" must be a beginner-friendly explanation of 2-4 lines.
4. Make the questions challenging and relevant to university-level ${course.title}.`;

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemInstruction }],
        response_format: { type: "json_object" },
        temperature: 0.5 // slightly higher temperature for variety in retakes
      })
    });

    if (!aiRes.ok) throw new Error("AI request failed");

    const groqData = await aiRes.json();
    const aiMessage = JSON.parse(groqData.choices[0].message.content);

    if (!aiMessage.questions || !Array.isArray(aiMessage.questions)) {
      throw new Error("AI returned an invalid format");
    }

    // Create a private practice quiz for the student
    const cleanTitle = originalQuiz.title.replace(" (Practice Retake)", "");
    const [newQuiz] = await db.insert(quizzes).values({
      courseId: originalQuiz.courseId,
      teacherId: originalQuiz.teacherId,
      title: `${cleanTitle} (Practice Retake)`,
      timeLimit: originalQuiz.timeLimit,
      studentId: userId // Link to the specific student
    }).returning();

    // Save practice questions to DB
    const questionsToInsert = aiMessage.questions.map((q: any) => ({
      quizId: newQuiz.id,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      points: 1,
      explanation: q.explanation || `The correct answer is "${q.correctAnswer}".`
    }));

    await db.insert(quizQuestions).values(questionsToInsert);

    return successResponse({ quizId: newQuiz.id }, "Practice quiz generated successfully", 200);

  } catch (error: any) {
    console.error("Quiz retake generation error:", error);
    return errorResponse(error.message || "Failed to generate practice quiz", 500);
  }
}
