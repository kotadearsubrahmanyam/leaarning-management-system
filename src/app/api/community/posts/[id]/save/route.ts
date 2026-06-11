import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postSaves } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(
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
    const postId = params.id;

    // Check post exists
    const postItem = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });
    if (!postItem) return errorResponse("Post not found", 404);

    // Check if already saved
    const existingSave = await db.query.postSaves.findFirst({
      where: and(eq(postSaves.postId, postId), eq(postSaves.userId, userId)),
    });

    if (existingSave) {
      // Unsave
      await db.delete(postSaves).where(eq(postSaves.id, existingSave.id));
      return successResponse({ saved: false }, "Post unsaved successfully");
    } else {
      // Save
      await db.insert(postSaves).values({
        id: crypto.randomUUID(),
        postId,
        userId,
      });
      return successResponse({ saved: true }, "Post saved successfully");
    }
  } catch (error) {
    console.error("Toggle save error:", error);
    return errorResponse("Internal server error", 500);
  }
}
