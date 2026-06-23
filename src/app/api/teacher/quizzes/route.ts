export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions, courses, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, inArray, and } from "drizzle-orm";

async function isTeacherOfCourse(teacherId: string, courseId: string) {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId)
  });
  if (course?.teacherId === teacherId) return true;

  const faculty = await db.query.courseFaculty.findFirst({
    where: and(eq(courseFaculty.courseId, courseId), eq(courseFaculty.teacherId, teacherId))
  });
  return !!faculty;
}

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

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { courseId, title, timeLimit = 15, status = "PUBLISHED", questions = [] } = body;

    if (!courseId || !title) return errorResponse("courseId and title are required", 400);

    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    // Save Quiz to DB
    const [newQuiz] = await db.insert(quizzes).values({
      courseId,
      teacherId: payload.id as string,
      title,
      timeLimit: parseInt(timeLimit.toString(), 10) || 15,
      status: status || "PUBLISHED"
    }).returning();

    // Save Questions to DB
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q: any) => ({
        quizId: newQuiz.id,
        question: q.question,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        points: q.points ? parseInt(q.points.toString(), 10) : 1
      }));
      await db.insert(quizQuestions).values(questionsToInsert);
    }

    return successResponse({ quizId: newQuiz.id }, "Quiz saved successfully", 201);

  } catch (error: any) {
    console.error("Save Quiz error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
