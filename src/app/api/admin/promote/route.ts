import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, results, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, inArray, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse("Missing or invalid studentIds array", 400);
    }

    // Process each student to see if they can be promoted
    const promotedIds = [];
    const failedIds = [];

    for (const studentId of studentIds) {
      // Get student's current semester
      const student = await db.query.users.findFirst({
        where: eq(users.id, studentId)
      });

      if (!student || student.role !== "STUDENT" || !student.semester) continue;

      // Get their results for their current semester courses
      const studentResults = await db.select({ marks: results.marks })
        .from(results)
        .innerJoin(courses, eq(results.courseId, courses.id))
        .where(and(
          eq(results.userId, studentId),
          eq(courses.semester, student.semester)
        ));

      // Need results to evaluate. Assuming 4 courses per semester.
      if (studentResults.length === 0) {
        failedIds.push(studentId);
        continue;
      }

      // Check if all marks are >= 40
      const isPass = studentResults.every(r => r.marks >= 40);

      if (isPass && student.semester < 8) {
        // Promote
        await db.update(users).set({ semester: student.semester + 1 }).where(eq(users.id, studentId));
        promotedIds.push(studentId);
      } else {
        failedIds.push(studentId);
      }
    }

    return successResponse({ promotedCount: promotedIds.length, failedCount: failedIds.length }, `Promoted ${promotedIds.length} students.`, 200);
  } catch (error) {
    console.error("Promotion Error", error);
    return errorResponse("Internal error", 500);
  }
}
