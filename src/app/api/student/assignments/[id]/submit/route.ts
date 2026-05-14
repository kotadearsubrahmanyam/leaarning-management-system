import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { content, fileUrl } = body;

    const [submission] = await db.insert(submissions).values({
      assignmentId: params.id,
      userId: payload.id as string,
      content,
      fileUrl,
      status: "SUBMITTED",
    }).returning();

    return successResponse({ submission }, "Assignment submitted successfully");
  } catch (error) {
    console.error("Submit assignment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
