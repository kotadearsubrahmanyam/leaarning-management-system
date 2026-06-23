export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions, courses, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

async function isTeacherOfCourse(teacherId: string, courseId: string) {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId)
  });
  if (course?.teacherId === teacherId) return true;

  const faculty = await db.query.courseFaculty.findFirst({
    where: and(eq(courseFaculty.courseId, courseId), eq(courseFaculty.teacherId, teacherId))
  });
  return !!faculty;
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { courseId, count = 10, timeLimit = 15 } = body;

    if (!courseId) return errorResponse("courseId is required", 400);

    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (!course) return errorResponse("Course not found", 404);

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    const systemInstruction = `You are an expert professor. The course topic is "${course.title}".
Generate exactly ${count} multiple-choice questions for a quiz.
    
You must output ONLY valid JSON in the exact following format:
{
  "questions": [
    {
      "question": "What is the primary function of...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "A short, 2-4 lines beginner-friendly, educational explanation of why the correct answer is right and why it is important."
    }
  ]
}
Requirements:
1. "options" must be an array of exactly 4 strings, or exactly ["True", "False"] for True/False questions.
2. "correctAnswer" must be identical to one of the options.
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
        temperature: 0.3
      })
    });

    if (!aiRes.ok) throw new Error("AI request failed");

    const groqData = await aiRes.json();
    const aiMessage = JSON.parse(groqData.choices[0].message.content);

    if (!aiMessage.questions || !Array.isArray(aiMessage.questions)) {
      throw new Error("AI returned an invalid format");
    }

    // Save Quiz to DB
    const [newQuiz] = await db.insert(quizzes).values({
      courseId,
      teacherId: payload.id as string,
      title: `${course.title} - AI Generated Quiz`,
      timeLimit
    }).returning();

    // Save Questions to DB
    const questionsToInsert = aiMessage.questions.map((q: any) => ({
      quizId: newQuiz.id,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      points: 1,
      explanation: q.explanation || `The correct answer is "${q.correctAnswer}".`
    }));

    await db.insert(quizQuestions).values(questionsToInsert);

    return successResponse({ quizId: newQuiz.id }, "AI Quiz Generated successfully", 200);

  } catch (error: any) {
    console.error("AI Quiz error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
