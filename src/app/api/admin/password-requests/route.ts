export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Unauthorized", 403);

    // Fetch pending requests from teachers
    const pendingRequests = await db
      .select({
        id: passwordResetRequests.id,
        userId: passwordResetRequests.userId,
        teacherName: users.name,
        teacherEmail: users.email,
        teacherDepartmentId: users.departmentId,
        createdAt: passwordResetRequests.createdAt,
      })
      .from(passwordResetRequests)
      .innerJoin(users, eq(users.id, passwordResetRequests.userId))
      .where(
        and(
          eq(passwordResetRequests.status, "PENDING"),
          eq(passwordResetRequests.role, "TEACHER")
        )
      );

    return successResponse({ requests: pendingRequests }, "Pending teacher password requests fetched successfully");
  } catch (error) {
    console.error("Fetch teacher password requests error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Unauthorized", 403);

    const adminId = payload.id as string;
    const body = await req.json();
    const { requestId, tempPassword } = body;

    if (!requestId || !tempPassword) {
      return errorResponse("Request ID and temporary password are required", 400);
    }

    if (tempPassword.length < 6) {
      return errorResponse("Temporary password must be at least 6 characters long", 400);
    }

    // Verify request exists and is pending
    const requestResult = await db
      .select()
      .from(passwordResetRequests)
      .where(and(eq(passwordResetRequests.id, requestId), eq(passwordResetRequests.status, "PENDING")))
      .limit(1);

    if (requestResult.length === 0) {
      return errorResponse("Request not found or already resolved", 404);
    }

    const resetReq = requestResult[0];

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update teacher's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetReq.userId));

    // Update reset request to RESOLVED
    await db
      .update(passwordResetRequests)
      .set({
        status: "RESOLVED",
        tempPassword: tempPassword, // save so admin can show it to teacher
        resolvedAt: new Date(),
        resolvedBy: adminId,
      })
      .where(eq(passwordResetRequests.id, requestId));

    return successResponse(null, "Teacher password reset successfully with temporary credentials");
  } catch (error) {
    console.error("Resolve teacher password request error:", error);
    return errorResponse("Internal server error", 500);
  }
}
