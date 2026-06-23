export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-service";
import { errorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { payload, status } = await callAiService("/api/chat", body);
    return NextResponse.json(payload, { status });
  } catch (error: any) {
    const status = error.status ?? 502;
    return errorResponse(error.message || "Failed to call AI chat service", status);
  }
}
