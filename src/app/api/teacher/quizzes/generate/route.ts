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
    const { courseId, prompt = "", count = 10, difficulty = "Medium", questionType = "MCQ", timeLimit = 15 } = body;

    if (!courseId) return errorResponse("courseId is required", 400);

    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (!course) return errorResponse("Course not found", 404);

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    // Attempt to extract question count from user prompt (e.g. "15 questions")
    let finalCount = count;
    if (prompt) {
      const match = prompt.match(/(\d+)\s*(questions?|qns?)/i);
      if (match) {
        const parsed = parseInt(match[1]);
        if (parsed >= 1 && parsed <= 50) {
          finalCount = parsed;
        }
      }
    }

    const systemInstruction = `You are an expert professor. The course topic is "${course.title}".
Generate exactly ${finalCount} multiple-choice questions for a quiz.
${prompt ? `Focus the quiz specifically on this topic/prompt: "${prompt}".` : ""}
Difficulty level: ${difficulty}.
Question format: ${questionType === "MCQ" ? "Multiple-Choice Questions with 4 options" : questionType === "True/False" ? "True/False Questions" : "Mixed format (both MCQs and True/False questions)"}.
    
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
1. "options" must be an array of exactly 4 strings for MCQs, or exactly ["True", "False"] for True/False questions.
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

    // Do NOT save the quiz or questions to the DB at this preview generation step.
    // The frontend expects successResponse with questions data to preview it.
    return successResponse({ questions: aiMessage.questions }, "AI Quiz generated successfully", 200);

  } catch (error: any) {
    console.error("AI Quiz error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
