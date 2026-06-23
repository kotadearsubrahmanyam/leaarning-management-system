export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, courseFaculty } from "@/db/schema";
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
    const { courseId, prompt = "", difficulty = "Medium", questionType = "MCQ", existingQuestions = [] } = body;

    if (!courseId) return errorResponse("courseId is required", 400);

    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (!course) return errorResponse("Course not found", 404);

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    const avoidSection = existingQuestions.length > 0 
      ? `CRITICAL REQUIREMENT: Avoid generating any of the following questions (do not reuse them or make very similar questions):
${existingQuestions.map((q: string, idx: number) => `${idx + 1}. "${q}"`).join("\n")}`
      : "";

    const systemInstruction = `You are an expert professor. The course topic is "${course.title}".
Generate exactly 1 single question for a quiz.
    
Teacher's specific instructions / topics to cover:
"${prompt}"

Difficulty Level: ${difficulty}
Question Format: ${questionType} (MCQ: 4 choices; True/False: 2 choices: ["True", "False"]; Mixed: MCQ or True/False)

${avoidSection}

You must output ONLY valid JSON in the exact following format:
{
  "question": "What is the primary function of...?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option B"
}
Requirements:
1. For MCQ, "options" must be an array of exactly 4 strings. "correctAnswer" must be identical to one of them.
2. For True/False, "options" must be exactly ["True", "False"]. "correctAnswer" must be either "True" or "False".
3. Make the question challenging and relevant to university-level ${course.title}.`;

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
        temperature: 0.5
      })
    });

    if (!aiRes.ok) throw new Error("AI request failed");

    const groqData = await aiRes.json();
    const aiQuestion = JSON.parse(groqData.choices[0].message.content);

    if (!aiQuestion.question || !aiQuestion.options || !aiQuestion.correctAnswer) {
      throw new Error("AI returned an invalid format for the single question");
    }

    return successResponse({ question: aiQuestion }, "Question generated successfully", 200);

  } catch (error: any) {
    console.error("AI Single Question error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
