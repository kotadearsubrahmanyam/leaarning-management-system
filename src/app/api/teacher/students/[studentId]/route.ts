export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, enrollments, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { studentId: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { studentId } = params;

    const student = await db.query.users.findFirst({
      where: and(eq(users.id, studentId), eq(users.role, "STUDENT")),
      with: {
        department: true,
        enrollments: {
          with: { course: true }
        },
        attendance: {
          with: { session: { with: { course: true } } },
          orderBy: (attendance, { desc }) => [desc(attendance.timestamp)],
        },
        results: {
          with: { course: true },
          orderBy: (results, { desc }) => [desc(results.createdAt)],
        },
        activities: {
          orderBy: (activities, { desc }) => [desc(activities.date)],
        },
      },
    });

    if (!student) {
      return errorResponse("Student not found", 404);
    }

    // Get the courses taught by this teacher that this student has opted for
    const teacherSections = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .innerJoin(courseFaculty, eq(enrollments.courseFacultyId, courseFaculty.id))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(courseFaculty.teacherId, payload.id as string)
        )
      );
    const teacherCourseIds = new Set(teacherSections.map(s => s.courseId));

    // Enrich results with canGeneratePathway property
    const enrichedResults = student.results.map((r: any) => ({
      ...r,
      canGeneratePathway: r.status === "FAIL" && r.courseId && teacherCourseIds.has(r.courseId),
    }));

    const enrichedStudent = {
      ...student,
      results: enrichedResults
    };

    return successResponse({ student: enrichedStudent }, "Fetched student details successfully");
  } catch (error) {
    console.error("Fetch student details error:", error);
    return errorResponse("Internal server error", 500);
  }
}
