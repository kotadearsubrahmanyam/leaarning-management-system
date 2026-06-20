import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/db";
import { aiInterviewSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const body = await req.json();
    const { topic, history, latestAnswer, isFirstQuestion } = body;

    if (!topic) {
      return errorResponse("Topic is required", 400);
    }

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    const systemInstruction = `You are an expert technical recruiter conducting an interview. The topic is "${topic}".
      
You must output ONLY valid JSON in the exact following format:
{
  "nextQuestion": "The text of your next question",
  "feedbackOnLastAnswer": "A very brief acknowledgment of their last answer (e.g. 'Got it.', 'Okay.', 'Interesting point.', 'Makes sense.') - MUST BE under 10 words. Do NOT give detailed feedback, critiques, corrections, or explanations here.",
  "isFinished": false,
  "finalScore": null,
  "finalFeedback": null
}
If the interview is over, output:
{
  "nextQuestion": null,
  "feedbackOnLastAnswer": "A very brief final acknowledgment.",
  "isFinished": true,
  "finalScore": 85,
  "finalFeedback": "A comprehensive evaluation. Format it exactly as:\n\n### Overall Summary & Recommendations:\n[Detailed behavioral and technical summary feedback]\n\n### Question-by-Question Evaluation:\n1. **Question**: [Question text]\n   **Your Answer**: [Answer text]\n   **Technical Feedback**: [Detailed technical critique of their answer, explaining what was correct, incorrect, or missing in depth]\n   **Proctoring/Behavioral Feedback**: [Detailed assessment of their discipline, eye contact, confidence, voice level, and use of filler words based on tracked proctoring metrics]\n\n2. ... (repeat for all questions asked during the interview)"
}

Guidelines:
1. Start by welcoming the candidate and asking the first question.
2. During the interview: Acknowledge answers extremely briefly in 'feedbackOnLastAnswer' (maximum 1 sentence, less than 10 words, e.g. "Okay", "Got it", "Interesting perspective.") and ask the next question immediately. Do not explain the correct answers, give feedback, or provide technical/behavioral critiques between questions.
3. The user's prompt will include [PROCTORING METRICS]. Track these metrics silently for each turn. Do not evaluate them immediately. You must combine and include them in the proctoring/behavioral feedback for each question and in the overall summary at the end.
4. Ask exactly 3 to 5 questions. Conclude the interview after sufficient questions by setting 'isFinished' to true.
5. If 'isFinished' is true, you MUST look back at the conversation history and construct a comprehensive feedback breakdown starting with the Overall Summary & Recommendations, followed by the detailed Question-by-Question Evaluation list.
6. Make questions highly relevant to the candidate's responses and ensure they flow logically as related follow-up questions or adjacent concepts to simulate a real interview.`;

    const prompt = isFirstQuestion 
      ? `The candidate is ready. Start the interview on the topic of ${topic}.`
      : `The candidate answered: "${latestAnswer}". Acknowledge the answer very briefly (no feedback, grade, or critique), and ask the next related question on the topic. Do not evaluate yet. Conclude the interview if 3 to 5 questions have been asked.`;

    let dbSession;
    if (isFirstQuestion) {
      // Create new session
      const [newSession] = await db.insert(aiInterviewSessions).values({
        userId: payload.id as string,
        topic,
        history: JSON.stringify([]),
        isFinished: false
      }).returning();
      dbSession = newSession;
    } else {
      // Find active session
      dbSession = await db.query.aiInterviewSessions.findFirst({
        where: and(
          eq(aiInterviewSessions.userId, payload.id as string),
          eq(aiInterviewSessions.topic, topic),
          eq(aiInterviewSessions.isFinished, false)
        ),
        orderBy: desc(aiInterviewSessions.createdAt)
      });
      if (!dbSession) return errorResponse("No active interview session found", 404);
    }

    const savedHistory = JSON.parse(dbSession.history);

    const messages = [
      { role: "system", content: systemInstruction },
      ...savedHistory,
      { role: "user", content: prompt }
    ];

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!aiRes.ok) throw new Error("AI request failed");

    const groqData = await aiRes.json();
    const aiMessage = JSON.parse(groqData.choices[0].message.content);

    // Update session history
    const newHistory = [
      ...savedHistory,
      { role: "user", content: prompt },
      { role: "assistant", content: JSON.stringify(aiMessage) }
    ];

    await db.update(aiInterviewSessions)
      .set({ 
        history: JSON.stringify(newHistory),
        isFinished: aiMessage.isFinished || false,
        score: aiMessage.finalScore || null
      })
      .where(eq(aiInterviewSessions.id, dbSession.id));

    return successResponse({ aiResponse: aiMessage }, "AI generated response");
  } catch (error: any) {
    console.error("AI Interview error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
