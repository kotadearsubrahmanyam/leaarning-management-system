export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { mentoringPlans, results, courses, users } from "@/db/schema";
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
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) return errorResponse("studentId is required", 400);

    const student = await db.query.users.findFirst({ where: eq(users.id, studentId) });
    if (!student) return errorResponse("Student not found", 404);

    // Get student's failed courses
    const failedResults = await db.select({
      subjectName: courses.title,
      internalMarks: results.internalMarks,
      externalMarks: results.externalMarks,
      totalMarks: results.marks
    })
    .from(results)
    .leftJoin(courses, eq(results.courseId, courses.id))
    .where(and(eq(results.userId, studentId), eq(results.status, "FAIL"), eq(results.published, true)));

    if (failedResults.length === 0) {
      return errorResponse("This student has no backlogs. A mentoring plan is not necessary.", 400);
    }

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    const failedSubjectsList = failedResults.map(r => `${r.subjectName} (Scored: ${r.totalMarks})`).join(", ");

    const systemInstruction = `You are an expert academic mentor and professor.
You are tasked with writing a structured, 4-week recovery study plan for a student who has failed the following subjects:
${failedSubjectsList}

Requirements:
1. Output ONLY valid Markdown format.
2. Provide an encouraging but firm opening paragraph.
3. Include a weekly breakdown (Week 1 to Week 4) detailing what they should study and how they should approach passing these specific subjects.
4. Add a final section with 3 actionable tips for time management and exam preparation.
5. Do NOT include any markdown code blocks (e.g. \`\`\`markdown). Just output the raw markdown text directly.`;

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemInstruction }],
        temperature: 0.5
      })
    });

    if (!aiRes.ok) throw new Error("AI request failed");

    const groqData = await aiRes.json();
    let planContent = groqData.choices[0].message.content;
    
    // Cleanup markdown wrapping if AI mistakenly included it
    if (planContent.startsWith("```markdown")) {
      planContent = planContent.replace(/^```markdown\n/, "").replace(/\n```$/, "");
    }

    const [newPlan] = await db.insert(mentoringPlans).values({
      studentId,
      teacherId: payload.id as string,
      planContent
    }).returning();

    return successResponse({ planId: newPlan.id }, "Mentoring Plan Generated successfully", 200);

  } catch (error: any) {
    console.error("AI Mentoring error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
