import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

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
  "feedbackOnLastAnswer": "Brief feedback on their last answer (null if first question)",
  "isFinished": false,
  "finalScore": null,
  "finalFeedback": null
}
If the interview is over, output:
{
  "nextQuestion": null,
  "feedbackOnLastAnswer": "Feedback on final answer",
  "isFinished": true,
  "finalScore": 85,
  "finalFeedback": "Detailed feedback summary"
}

Guidelines:
1. Start by welcoming the candidate and asking the first question.
2. Evaluate their latest answer for technical accuracy.
3. The user's prompt will include [PROCTORING METRICS]. You MUST act as a strict evaluator and use these metrics to judge their discipline (eye contact) and confidence (voice intensity, filler words). Specifically mention these behaviors in your feedback. If they look away often, have low voice intensity, or use many filler words, strictly deduct points and point it out!
4. Ask 3 to 5 questions total. If they have answered enough questions or the time is up, set 'isFinished' to true.
5. If 'isFinished' is true, provide a 'finalScore' out of 100 and detailed 'finalFeedback' that incorporates both technical and behavioral performance.
6. Make questions relevant to ${topic}.`;

    const prompt = isFirstQuestion 
      ? `The candidate is ready. Start the interview on the topic of ${topic}.`
      : `The candidate answered: "${latestAnswer}". Evaluate it and generate the next question, or conclude the interview if sufficient questions have been asked.`;

    const messages = [
      { role: "system", content: systemInstruction },
      ...(history || []),
      { role: "user", content: prompt }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return errorResponse("AI returned an error", 500);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return errorResponse("AI returned an invalid format", 500);
    }

    return successResponse({ aiResponse: jsonResponse }, "AI generated response");
  } catch (error: any) {
    console.error("AI Interview error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
