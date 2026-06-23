import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetRequests } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return errorResponse("Token and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("Password must be at least 6 characters long", 400);
    }

    // Verify token exists, is pending and not expired
    const requestResult = await db
      .select()
      .from(passwordResetRequests)
      .where(
        and(
          eq(passwordResetRequests.resetToken, token),
          eq(passwordResetRequests.status, "PENDING")
        )
      )
      .limit(1);

    if (requestResult.length === 0) {
      return errorResponse("Invalid or already used recovery token", 404);
    }

    const resetReq = requestResult[0];

    // Check if token has expired
    if (resetReq.tokenExpiry && new Date() > new Date(resetReq.tokenExpiry)) {
      // Mark it as rejected since it expired
      await db
        .update(passwordResetRequests)
        .set({ status: "REJECTED" })
        .where(eq(passwordResetRequests.id, resetReq.id));
      return errorResponse("Recovery token has expired. Please request a new link", 400);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetReq.userId));

    // Mark the reset request as RESOLVED
    await db
      .update(passwordResetRequests)
      .set({
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: resetReq.userId, // resolved by self via email link
      })
      .where(eq(passwordResetRequests.id, resetReq.id));

    return successResponse(null, "Password reset successfully", 200);
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse("Internal server error", 500);
  }
}
