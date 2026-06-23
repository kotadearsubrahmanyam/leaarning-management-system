export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postLikes, notifications, users } from "@/db/schema";
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

    // Check if already liked
    const existingLike = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)),
    });

    if (existingLike) {
      // Unlike
      await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
      return successResponse({ liked: false }, "Post unliked successfully");
    } else {
      // Like
      await db.insert(postLikes).values({
        id: crypto.randomUUID(),
        postId,
        userId,
      });

      // Get user name
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      // Notify post author (if not liking own post)
      if (postItem.authorId !== userId) {
        await db.insert(notifications).values({
          userId: postItem.authorId,
          title: "❤️ Post Liked",
          message: `${user?.name || "Someone"} liked your post.`,
          isRead: false,
        });
      }

      return successResponse({ liked: true }, "Post liked successfully");
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return errorResponse("Internal server error", 500);
  }
}
