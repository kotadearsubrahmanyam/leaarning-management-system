export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

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

    const userRole = payload.role as string;
    const postId = params.id;

    if (userRole !== "ADMIN") {
      return errorResponse("Only administrators can pin or unpin posts", 403);
    }

    // Check post exists
    const postItem = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });
    if (!postItem) return errorResponse("Post not found", 404);

    const newPinStatus = !postItem.isPinned;

    const [updatedPost] = await db.update(posts)
      .set({ isPinned: newPinStatus, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();

    return successResponse({ post: updatedPost }, `Post ${newPinStatus ? "pinned" : "unpinned"} successfully`);
  } catch (error) {
    console.error("Toggle pin error:", error);
    return errorResponse("Internal server error", 500);
  }
}
