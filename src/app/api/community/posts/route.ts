export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users, notifications, postLikes, postSaves } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, ne, or, ilike, and } from "drizzle-orm";

// GET feed posts
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const userId = payload.id as string;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const savedOnly = searchParams.get("savedOnly") === "true";

    // Build base query conditions
    const conditions = [];
    if (category && category !== "ALL") {
      conditions.push(eq(posts.category, category));
    }

    const dbPosts = await db.query.posts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            rollNumber: true,
          }
        },
        likes: true,
        saves: true,
        comments: {
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                role: true,
                rollNumber: true,
              }
            }
          },
          orderBy: (comments, { asc }) => [asc(comments.createdAt)]
        }
      },
      orderBy: (posts, { desc }) => [desc(posts.isPinned), desc(posts.createdAt)]
    });

    // Client-side text search and filtering for rich user matches
    let filtered = dbPosts;
    if (search) {
      const s = search.toLowerCase();
      filtered = dbPosts.filter(p => 
        p.content.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        (p.author as any).name.toLowerCase().includes(s) ||
        ((p.author as any).rollNumber || "").toLowerCase().includes(s)
      );
    }

    if (savedOnly) {
      filtered = filtered.filter(p => p.saves.some(s => s.userId === userId));
    }

    // Append counts and user interaction status
    const result = filtered.map(p => ({
      ...p,
      likesCount: p.likes.length,
      commentsCount: p.comments.length,
      isLiked: p.likes.some(l => l.userId === userId),
      isSaved: p.saves.some(s => s.userId === userId),
    }));

    return successResponse({ posts: result }, "Fetched posts successfully");
  } catch (error) {
    console.error("Fetch posts error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST create a post
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const userId = payload.id as string;
    const authorRole = payload.role as string;
    
    // Fetch author details
    const author = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!author) return errorResponse("Author not found", 404);

    const body = await req.json();
    const { content, category, attachments, linkShare, isAnnouncement = false, isPinned = false } = body;

    if (!content || !category) {
      return errorResponse("Content and category are required", 400);
    }

    // Access control check
    if (isPinned && authorRole !== "ADMIN") {
      return errorResponse("Only administrators can pin posts", 403);
    }
    if (isAnnouncement && !["ADMIN", "TEACHER"].includes(authorRole)) {
      return errorResponse("Only faculty and administrators can make academic announcements", 403);
    }

    // Professor Tagging Firewall & Mention Parsing
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    const mentionedUsernames = Array.from(new Set(matches.map((m: any) => m[1].toLowerCase())));
    let matchedUsers: any[] = [];

    if (mentionedUsernames.length > 0) {
      const dbUsers = await db.select().from(users);
      matchedUsers = dbUsers.filter(u => {
        const uRoll = (u.rollNumber || "").toLowerCase();
        const uEmail = u.email.split("@")[0].toLowerCase();
        const uNameClean = u.name.replace(/\s+/g, "").toLowerCase();
        return (
          mentionedUsernames.includes(uRoll) ||
          mentionedUsernames.includes(uEmail) ||
          mentionedUsernames.includes(uNameClean)
        );
      });

      if (authorRole === "STUDENT") {
        const taggedOfficials = matchedUsers.filter(u => u.role === "TEACHER" || u.role === "ADMIN");
        if (taggedOfficials.length > 0) {
          return errorResponse("Students cannot tag University Officials in public posts. Please use the direct messaging system for academic queries.", 403);
        }
      }
    }

    // Insert post
    const [newPost] = await db.insert(posts).values({
      authorId: userId,
      content,
      category,
      attachments: attachments ? JSON.stringify(attachments) : null,
      linkShare: linkShare || null,
      isAnnouncement,
      isPinned,
    }).returning();

    // 1. Send announcement alerts to all other campus users
    if (isAnnouncement) {
      const allUsers = await db.select({ id: users.id }).from(users).where(ne(users.id, userId));
      if (allUsers.length > 0) {
        const notificationsData = allUsers.map(u => ({
          userId: u.id,
          title: `📢 Announcement: ${category}`,
          message: `${author.name} posted a new announcement: "${content.substring(0, 45)}${content.length > 45 ? "..." : ""}"`,
          isRead: false,
        }));
        await db.insert(notifications).values(notificationsData);
      }
    }

    // 2. Send notifications to mentioned users
    if (matchedUsers.length > 0) {
        const mentionNotifications = matchedUsers
          .filter(u => u.id !== userId)
          .map(u => ({
            userId: u.id,
            title: "💬 Mentions Hub",
            message: `${author.name} mentioned you in a community post.`,
            isRead: false,
          }));

        if (mentionNotifications.length > 0) {
          await db.insert(notifications).values(mentionNotifications);
        }
      }

    return successResponse({ post: newPost }, "Post created successfully", 201);
  } catch (error) {
    console.error("Create post error:", error);
    return errorResponse("Internal server error", 500);
  }
}
