import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, courses, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const teacherId = payload.id as string;

    const ownedCourses = await db.select({ id: courses.id }).from(courses).where(eq(courses.teacherId, teacherId));
    const facultyCourses = await db.select({ id: courseFaculty.courseId }).from(courseFaculty).where(eq(courseFaculty.teacherId, teacherId));
    const allCourseIds = Array.from(new Set([...ownedCourses.map(c => c.id), ...facultyCourses.map(c => c.id)]));

    if (allCourseIds.length === 0) {
      return successResponse({ quizzes: [] }, "Fetched quizzes", 200);
    }

    const teacherQuizzes = await db.query.quizzes.findMany({
      where: inArray(quizzes.courseId, allCourseIds),
      orderBy: desc(quizzes.createdAt)
    });

    return successResponse({ quizzes: teacherQuizzes }, "Fetched quizzes", 200);

  } catch (error: any) {
    console.error("Fetch Teacher Quizzes error:", error);
    return errorResponse("Internal error", 500);
  }
}
