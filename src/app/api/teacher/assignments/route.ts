import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignments, courses, courseFaculty, submissions, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

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

    const ownedCourses = await db.select({ id: courses.id }).from(courses).where(eq(courses.teacherId, payload.id as string));
    const facultyCourses = await db.select({ id: courseFaculty.courseId }).from(courseFaculty).where(eq(courseFaculty.teacherId, payload.id as string));
    const allCourseIds = Array.from(new Set([...ownedCourses.map(c => c.id), ...facultyCourses.map(c => c.id)]));

    if (allCourseIds.length === 0) {
      return successResponse({ assignments: [] }, "Fetched assignments successfully", 200);
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const conditions = [inArray(assignments.courseId, allCourseIds)];
    if (courseId) {
       conditions.push(eq(assignments.courseId, courseId));
    }

    const data = await db.select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      instructions: assignments.instructions,
      questions: assignments.questions,
      attachmentUrl: assignments.attachmentUrl,
      publishDate: assignments.publishDate,
      dueDate: assignments.dueDate,
      totalMarks: assignments.totalMarks,
      status: assignments.status,
      courseId: assignments.courseId,
      courseName: courses.title,
      semester: courses.semester,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(...conditions))
    .orderBy(desc(assignments.createdAt));

    // Append submission counts and enrolled student counts
    const dataWithCounts = await Promise.all(data.map(async (a) => {
      const [subCountResult] = await db.select({
        count: sql<number>`count(*)::int`
      })
      .from(submissions)
      .where(eq(submissions.assignmentId, a.id));

      const [enrollCountResult] = await db.select({
        count: sql<number>`count(*)::int`
      })
      .from(enrollments)
      .where(eq(enrollments.courseId, a.courseId));

      return {
        ...a,
        submissionCount: subCountResult?.count || 0,
        enrolledCount: enrollCountResult?.count || 0,
      };
    }));

    return successResponse({ assignments: dataWithCounts }, "Fetched assignments successfully", 200);
  } catch (error) {
    console.error("Fetch assignments error", error);
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
    const { courseId, title, description, instructions, questions, attachmentUrl, dueDate, totalMarks, status } = body;

    if (!courseId || !title || !dueDate) return errorResponse("Missing required fields", 400);
    
    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const [newAssignment] = await db.insert(assignments).values({
      courseId,
      title,
      description: description || instructions || "",
      instructions: instructions || description || "",
      questions: questions || "",
      attachmentUrl: attachmentUrl || null,
      dueDate: new Date(dueDate),
      totalMarks: totalMarks ? parseInt(totalMarks, 10) : 100,
      status: status || "PUBLISHED",
      publishDate: new Date(),
    }).returning();

    return successResponse({ assignment: newAssignment }, "Assignment created", 201);
  } catch (error) {
    console.error("Create assignment error", error);
    return errorResponse("Internal error", 500);
  }
}
