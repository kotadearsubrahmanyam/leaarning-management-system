import { errorResponse } from "@/lib/api-response";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

export async function callAiService(path: string, body: unknown) {
  const url = `${AI_SERVICE_URL}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || "AI service request failed";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return { payload, status: response.status };
}
