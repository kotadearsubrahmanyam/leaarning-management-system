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

    if (!process.env.GROQ_API_KEY) {
      return errorResponse("AI is not configured", 500);
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return errorResponse("Audio file is required", 400);
    }

    const groqFormData = new FormData();
    groqFormData.append("file", file, "audio.webm");
    groqFormData.append("model", "whisper-large-v3");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: groqFormData as any
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq Whisper error:", errText);
      return errorResponse("Transcription failed", 500);
    }

    const data = await response.json();
    return successResponse({ text: data.text }, "Transcription successful");

  } catch (error: any) {
    console.error("Transcription API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
