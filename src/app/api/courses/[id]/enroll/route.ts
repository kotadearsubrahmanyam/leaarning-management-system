import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const courseId = params.id;
    const studentId = payload.id as string;

    // Check if course exists
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    // Check if already enrolled
    const [existingEnrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existingEnrollment) {
      return errorResponse("Already enrolled in this course", 400);
    }

    const newEnrollment = await db
      .insert(enrollments)
      .values({
        studentId,
        courseId,
      })
      .returning();

    return successResponse({ enrollment: newEnrollment[0] }, "Successfully enrolled in course", 201);
  } catch (error) {
    console.error("Enrollment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
