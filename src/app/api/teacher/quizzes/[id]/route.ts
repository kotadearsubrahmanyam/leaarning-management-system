import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizQuestions, courses, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const quizId = params.id;
    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return errorResponse("Quiz not found", 404);

    const isOwner = await isTeacherOfCourse(payload.id as string, quiz.courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const questions = await db.query.quizQuestions.findMany({ where: eq(quizQuestions.quizId, quizId) });
    
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: typeof q.options === "string" ? JSON.parse(q.options) : q.options
    }));

    return successResponse({ quiz: { ...quiz, questions: parsedQuestions } }, "Fetched quiz details", 200);
  } catch (error: any) {
    console.error("Fetch Quiz Details error:", error);
    return errorResponse("Internal error", 500);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const quizId = params.id;
    const body = await req.json();
    const { title, timeLimit, status, questions } = body;

    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return errorResponse("Quiz not found", 404);

    const isOwner = await isTeacherOfCourse(payload.id as string, quiz.courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (timeLimit !== undefined) updateData.timeLimit = parseInt(timeLimit.toString(), 10);
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      await db.update(quizzes).set(updateData).where(eq(quizzes.id, quizId));
    }

    if (questions !== undefined && Array.isArray(questions)) {
      // Clean delete existing questions and replace them
      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q: any) => ({
          quizId,
          question: q.question,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          points: q.points ? parseInt(q.points.toString(), 10) : 1
        }));
        await db.insert(quizQuestions).values(questionsToInsert);
      }
    }

    return successResponse(null, "Quiz updated successfully", 200);
  } catch (error: any) {
    console.error("Update Quiz error:", error);
    return errorResponse(error.message || "Internal error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const quizId = params.id;
    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return errorResponse("Quiz not found", 404);

    const isOwner = await isTeacherOfCourse(payload.id as string, quiz.courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    // Drizzle cascade references should handle deleting questions automatically, but we clean it up manually just in case
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    await db.delete(quizzes).where(eq(quizzes.id, quizId));

    return successResponse(null, "Quiz deleted successfully", 200);
  } catch (error: any) {
    console.error("Delete Quiz error:", error);
    return errorResponse("Internal error", 500);
  }
}
