import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, ne, and } from "drizzle-orm";

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const body = await req.json();
    const { name, email } = body;

    if (!name || name.trim().length === 0) {
      return errorResponse("Name is required", 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse("Valid email is required", 400);
    }

    // Check if email is already taken by another user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, payload.id as string)))
      .limit(1);

    if (existingUser.length > 0) {
      return errorResponse("Email is already in use by another account", 400);
    }

    const updatedUser = await db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, payload.id as string))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return successResponse({ user: updatedUser[0] }, "Profile updated successfully", 200);
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse("Internal server error", 500);
  }
}
