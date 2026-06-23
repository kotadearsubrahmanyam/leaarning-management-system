export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignments, submissions, courses, enrollments, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    // Fetch assignments for enrolled courses
    const studentAssignments = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        instructions: assignments.instructions,
        questions: assignments.questions,
        attachmentUrl: assignments.attachmentUrl,
        totalMarks: assignments.totalMarks,
        publishDate: assignments.publishDate,
        dueDate: assignments.dueDate,
        courseName: courses.title,
        submissionStatus: submissions.status,
        marks: submissions.marks,
        feedback: submissions.feedback,
        submissionContent: submissions.content,
        submissionFileUrl: submissions.fileUrl,
        facultyName: users.name,
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .innerJoin(users, eq(courses.teacherId, users.id))
      .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
      .leftJoin(submissions, and(
        eq(submissions.assignmentId, assignments.id),
        eq(submissions.userId, payload.id as string)
      ))
      .where(
        and(
          eq(enrollments.studentId, payload.id as string),
          eq(assignments.status, "PUBLISHED")
        )
      )
      .orderBy(desc(assignments.dueDate));

    return successResponse({ assignments: studentAssignments }, "Fetched assignments successfully");
  } catch (error) {
    console.error("Fetch assignments error:", error);
    return errorResponse("Internal server error", 500);
  }
}
