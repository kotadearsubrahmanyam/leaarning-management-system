import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, assignments, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    // Verify assignment exists and student is enrolled in the course
    const [assignment] = await db
      .select({ courseId: assignments.courseId })
      .from(assignments)
      .where(eq(assignments.id, params.id));

    if (!assignment) {
      return errorResponse("Assignment not found", 404);
    }

    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, payload.id as string),
          eq(enrollments.courseId, assignment.courseId)
        )
      );

    if (!enrollment) {
      return errorResponse("You are not enrolled in the course for this assignment", 403);
    }

    const body = await req.json();
    const { content, fileUrl, fileName, fileSize } = body;

    if (fileUrl) {
      const allowedExtensions = ['.pdf', '.docx', '.doc', '.zip', '.rar'];
      const ext = fileName ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : fileUrl.slice(fileUrl.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return errorResponse("Invalid file type. Only PDF, DOCX, and ZIP files are allowed.", 400);
      }
    }

    if (fileSize && fileSize > 10 * 1024 * 1024) {
      return errorResponse("File size exceeds 10MB limit.", 400);
    }

    const [submission] = await db.insert(submissions).values({
      assignmentId: params.id,
      userId: payload.id as string,
      content,
      fileUrl,
      status: "SUBMITTED",
    }).returning();

    return successResponse({ submission }, "Assignment submitted successfully");
  } catch (error) {
    console.error("Submit assignment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
