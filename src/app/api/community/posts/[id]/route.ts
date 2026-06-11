import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

// PUT edit post
export async function PUT(
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
    const postId = params.id;

    const existingPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!existingPost) {
      return errorResponse("Post not found", 404);
    }

    // Permission check: post owner or Admin
    if (existingPost.authorId !== userId && userRole !== "ADMIN") {
      return errorResponse("You do not have permission to edit this post", 403);
    }

    const body = await req.json();
    const { content, category, attachments, linkShare, isAnnouncement, isPinned } = body;

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (attachments !== undefined) updateData.attachments = attachments ? JSON.stringify(attachments) : null;
    if (linkShare !== undefined) updateData.linkShare = linkShare || null;

    if (isPinned !== undefined) {
      if (userRole !== "ADMIN") {
        return errorResponse("Only administrators can pin posts", 403);
      }
      updateData.isPinned = isPinned;
    }

    if (isAnnouncement !== undefined) {
      if (!["ADMIN", "TEACHER"].includes(userRole)) {
        return errorResponse("Only faculty and administrators can make academic announcements", 403);
      }
      updateData.isAnnouncement = isAnnouncement;
    }

    updateData.updatedAt = new Date();

    const [updatedPost] = await db.update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .returning();

    return successResponse({ post: updatedPost }, "Post updated successfully");
  } catch (error) {
    console.error("Update post error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE delete post
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
    const postId = params.id;

    const existingPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!existingPost) {
      return errorResponse("Post not found", 404);
    }

    // Permission check: post owner or Admin
    if (existingPost.authorId !== userId && userRole !== "ADMIN") {
      return errorResponse("You do not have permission to delete this post", 403);
    }

    await db.delete(posts).where(eq(posts.id, postId));

    return successResponse(null, "Post deleted successfully");
  } catch (error) {
    console.error("Delete post error:", error);
    return errorResponse("Internal server error", 500);
  }
}
