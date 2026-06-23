export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetRequests, enrollments, courseFaculty } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
    if (!payload || payload.role !== "TEACHER") return errorResponse("Unauthorized", 403);

    const teacherId = payload.id as string;

    // Fetch pending requests from students enrolled in courses taught by this teacher
    const pendingRequests = await db
      .select({
        id: passwordResetRequests.id,
        userId: passwordResetRequests.userId,
        studentName: users.name,
        studentEmail: users.email,
        studentRollNumber: users.rollNumber,
        studentSemester: users.semester,
        createdAt: passwordResetRequests.createdAt,
      })
      .from(passwordResetRequests)
      .innerJoin(users, eq(users.id, passwordResetRequests.userId))
      .innerJoin(enrollments, eq(enrollments.studentId, users.id))
      .innerJoin(courseFaculty, eq(courseFaculty.id, enrollments.courseFacultyId))
      .where(
        and(
          eq(courseFaculty.teacherId, teacherId),
          eq(passwordResetRequests.status, "PENDING"),
          eq(passwordResetRequests.role, "STUDENT")
        )
      )
      .groupBy(
        passwordResetRequests.id,
        passwordResetRequests.userId,
        users.name,
        users.email,
        users.rollNumber,
        users.semester
      );

    return successResponse({ requests: pendingRequests }, "Pending student password requests fetched successfully");
  } catch (error) {
    console.error("Fetch student password requests error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Unauthorized", 403);

    const teacherId = payload.id as string;
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

    // Double check that the student is taught by this teacher
    const taughtCheck = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .innerJoin(courseFaculty, eq(courseFaculty.id, enrollments.courseFacultyId))
      .where(and(eq(enrollments.studentId, resetReq.userId), eq(courseFaculty.teacherId, teacherId)))
      .limit(1);

    if (taughtCheck.length === 0) {
      return errorResponse("Unauthorized: This student is not in your classes", 403);
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update student's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetReq.userId));

    // Update reset request to RESOLVED
    await db
      .update(passwordResetRequests)
      .set({
        status: "RESOLVED",
        tempPassword: tempPassword, // save so teacher can show it to student
        resolvedAt: new Date(),
        resolvedBy: teacherId,
      })
      .where(eq(passwordResetRequests.id, requestId));

    return successResponse(null, "Student password reset successfully with temporary credentials");
  } catch (error) {
    console.error("Resolve student password request error:", error);
    return errorResponse("Internal server error", 500);
  }
}
