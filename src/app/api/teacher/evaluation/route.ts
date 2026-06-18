import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, assignments, courses, users, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, sql, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const conditions = [eq(courses.teacherId, payload.id as string)];
    if (courseId) {
      conditions.push(eq(courses.id, courseId));
    }

    const data = await db.select({
      id: submissions.id,
      assignmentTitle: assignments.title,
      courseName: courses.title,
      studentName: users.name,
      studentEmail: users.email,
      studentRollNumber: users.rollNumber,
      content: submissions.content,
      fileUrl: submissions.fileUrl,
      status: submissions.status,
      marks: submissions.marks,
      submittedAt: submissions.createdAt,
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(submissions.createdAt));

    return successResponse({ evaluations: data }, "Fetched evaluations successfully", 200);
  } catch (error) {
    console.error("Evaluation GET Error", error);
    return errorResponse("Internal error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { submissionId, marks } = body;

    if (!submissionId || marks === undefined) return errorResponse("Missing fields", 400);

    // Verify ownership
    const submissionData = await db.select({ 
        courseTeacherId: courses.teacherId,
        courseId: courses.id
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (submissionData.length === 0) {
      return errorResponse("Submission not found", 404);
    }

    let isAuthorized = submissionData[0].courseTeacherId === payload.id;
    if (!isAuthorized) {
       const [coTeacher] = await db.select().from(courseFaculty).where(
         and(
           eq(courseFaculty.courseId, submissionData[0].courseId),
           eq(courseFaculty.teacherId, payload.id as string)
         )
       );
       if (coTeacher) isAuthorized = true;
    }

    if (!isAuthorized) {
      return errorResponse("Forbidden", 403);
    }

    const marksInt = parseInt(marks);
    if (isNaN(marksInt) || marksInt < 0 || marksInt > 100) {
      return errorResponse(`Marks must be between 0 and 100`, 400);
    }

    await db.update(submissions)
      .set({ 
        marks: marksInt,
        status: "GRADED" 
      })
      .where(eq(submissions.id, submissionId));

    return successResponse(null, "Evaluated successfully", 200);
  } catch (error) {
    console.error("Evaluation PUT Error", error);
    return errorResponse("Internal error", 500);
  }
}
