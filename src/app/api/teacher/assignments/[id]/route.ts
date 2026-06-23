export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignments, courses, submissions, courseFaculty } from "@/db/schema";
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const assignmentId = params.id;
    const body = await req.json();
    const { title, description, instructions, questions, attachmentUrl, dueDate, totalMarks, status } = body;

    // Check ownership
    const assignment = await db.query.assignments.findFirst({ where: eq(assignments.id, assignmentId) });
    if (!assignment) return errorResponse("Not found", 404);
    
    const isOwner = await isTeacherOfCourse(payload.id as string, assignment.courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    // Edit is allowed even after submissions occur (per requirements, it shouldn't modify already graded submissions).
    // Updating the assignment record will not alter rows in the submissions table.
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (questions !== undefined) updateData.questions = questions;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (totalMarks !== undefined) updateData.totalMarks = parseInt(totalMarks, 10);
    if (status !== undefined) updateData.status = status;

    // Maintain backwards compatibility for description/instructions alignment
    if (instructions !== undefined && description === undefined) {
      updateData.description = instructions;
    }
    if (description !== undefined && instructions === undefined) {
      updateData.instructions = description;
    }

    const [updated] = await db.update(assignments)
      .set(updateData)
      .where(eq(assignments.id, assignmentId))
      .returning();

    return successResponse({ assignment: updated }, "Assignment updated", 200);
  } catch (error) {
    console.error("Update assignment error", error);
    return errorResponse("Internal error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const assignmentId = params.id;

    // Check ownership
    const assignment = await db.query.assignments.findFirst({ where: eq(assignments.id, assignmentId) });
    if (!assignment) return errorResponse("Not found", 404);
    
    const isOwner = await isTeacherOfCourse(payload.id as string, assignment.courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    // Lockdown Check: Are there any submissions?
    const existingSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.assignmentId, assignmentId)
    });

    if (existingSubmissions.length > 0) {
      return errorResponse("Cannot delete an assignment after students have begun submitting.", 400);
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    return successResponse(null, "Assignment deleted", 200);
  } catch (error) {
    console.error("Delete assignment error", error);
    return errorResponse("Internal error", 500);
  }
}
