export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const userId = payload.id as string;
    const userRole = payload.role as string;
    const commentId = params.id;

    // Check comment exists
    const commentItem = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });

    if (!commentItem) {
      return errorResponse("Comment not found", 404);
    }

    // Permission check: comment owner or Admin
    if (commentItem.authorId !== userId && userRole !== "ADMIN") {
      return errorResponse("You do not have permission to delete this comment", 403);
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    return successResponse(null, "Comment deleted successfully");
  } catch (error) {
    console.error("Delete comment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
