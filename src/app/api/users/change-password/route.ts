export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return errorResponse("Invalid token", 401);
    }

    const { id } = payload;
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("New password must be at least 6 characters long", 400);
    }

    // Fetch user details from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, id as string))
      .limit(1);

    if (userResult.length === 0) {
      return errorResponse("User not found", 404);
    }

    const user = userResult[0];

    // Verify current password is valid
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Incorrect current password", 400);
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return successResponse(null, "Password updated successfully", 200);
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Internal server error", 500);
  }
}
