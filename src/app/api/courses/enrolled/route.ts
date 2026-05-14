import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, users, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    if (payload.role !== "STUDENT") {
      return errorResponse("Forbidden", 403);
    }

    const fetchedCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        level: courses.level,
        imageUrl: courses.imageUrl,
        createdAt: courses.createdAt,
        teacherName: users.name,
        status: enrollments.status,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(courses.teacherId, users.id))
      .where(eq(enrollments.studentId, payload.id as string));

    const data = fetchedCourses.map(course => ({
      ...course,
      isEnrolled: true,
      progress: course.status === "COMPLETED" ? 100 : 50, // Mock progress based on status
    }));

    return successResponse({ courses: data }, "Enrolled courses fetched successfully", 200);
  } catch (error) {
    console.error("Fetch enrolled courses error:", error);
    return errorResponse("Internal server error", 500);
  }
}
