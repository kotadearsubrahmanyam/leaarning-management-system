export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, comments, notifications, users } from "@/db/schema";
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

    const body = await req.json();
    const { content, parentId } = body;

    if (!content) {
      return errorResponse("Comment content is required", 400);
    }

    const inserted = await db.insert(comments).values({
      id: crypto.randomUUID(),
      postId,
      authorId: userId,
      content,
      parentId: parentId || null,
    }).returning();
    const newComment = inserted[0];

    // Get commenter info
    const commenter = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const commenterName = commenter?.name || "Someone";

    // 1. Notify parent comment author (if reply) or post author (if main comment)
    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });

      if (parentComment && parentComment.authorId !== userId) {
        await db.insert(notifications).values({
          userId: parentComment.authorId,
          title: "💬 Comment Replied",
          message: `${commenterName} replied to your comment.`,
          isRead: false,
        });
      }
    } else {
      // Main comment, notify post owner
      if (postItem.authorId !== userId) {
        await db.insert(notifications).values({
          userId: postItem.authorId,
          title: "💬 New Comment",
          message: `${commenterName} commented on your post.`,
          isRead: false,
        });
      }
    }

    // 2. Parse @username mentions in comments and notify
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    const mentionedUsernames = Array.from(new Set(matches.map(m => m[1].toLowerCase())));

    if (mentionedUsernames.length > 0) {
      const dbUsers = await db.select().from(users);
      const matchedUsers = dbUsers.filter(u => {
        const uRoll = (u.rollNumber || "").toLowerCase();
        const uEmail = u.email.split("@")[0].toLowerCase();
        const uNameClean = u.name.replace(/\s+/g, "").toLowerCase();
        return (
          mentionedUsernames.includes(uRoll) ||
          mentionedUsernames.includes(uEmail) ||
          mentionedUsernames.includes(uNameClean)
        );
      });

      if (matchedUsers.length > 0) {
        const mentionNotifications = matchedUsers
          .filter(u => u.id !== userId)
          .map(u => ({
            userId: u.id,
            title: "💬 Mentions Hub",
            message: `${commenterName} mentioned you in a comment.`,
            isRead: false,
          }));

        if (mentionNotifications.length > 0) {
          await db.insert(notifications).values(mentionNotifications);
        }
      }
    }

    // Return comment along with author info format
    const formattedComment = {
      ...newComment,
      author: {
        id: commenter?.id,
        name: commenter?.name,
        role: commenter?.role,
        rollNumber: commenter?.rollNumber,
      }
    };

    return successResponse({ comment: formattedComment }, "Comment posted successfully", 201);
  } catch (error) {
    console.error("Post comment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
