export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, message, history } = body;

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured on the server", 500);
    }

    const systemMessage = {
      role: "system",
      content: "You are a powerful AI mentor. Give practical, real-world learning guidance. Avoid generic replies."
    };

    const messages = [
      systemMessage,
      ...(history || []).map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" : msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq Chat error:", errText);
      return errorResponse("Failed to generate AI response", 500);
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({
      user_id,
      reply
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to call AI chat service", 500);
  }
}
