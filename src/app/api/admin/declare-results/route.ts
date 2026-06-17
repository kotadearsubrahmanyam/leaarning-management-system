import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, users, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, inArray, sql } from "drizzle-orm";
import { recalculateStudentGpas, assignLearningPathOnFail } from "@/lib/gpa";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { departmentId, semester } = body;

    if (!departmentId || !semester) {
      return errorResponse("Missing departmentId or semester", 400);
    }

    // 1. Get all students in this department and semester
    const students = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.departmentId, departmentId),
        eq(users.semester, semester),
        eq(users.role, "STUDENT")
      ));

    if (students.length === 0) {
      return errorResponse("No students found in this batch.", 404);
    }

    const studentIds = students.map(s => s.id);

    // 2. Fetch all unpublished results for these students
    const unpublishedResults = await db.select({
      id: results.id,
      marks: results.marks,
      courseId: results.courseId
    })
    .from(results)
    .where(and(
      inArray(results.userId, studentIds),
      eq(results.published, false)
    ));

    if (unpublishedResults.length === 0) {
      return errorResponse("No unpublished results found for this batch.", 400);
    }

    // 3. Validation Check: Are marks entered?
    // Heuristic: If ALL students in a specific course have exactly 0 marks, the teacher likely forgot to enter marks.
    const courseStats = new Map();
    for (const res of unpublishedResults) {
      if (!res.courseId) continue;
      if (!courseStats.has(res.courseId)) {
        courseStats.set(res.courseId, { total: 0, zeros: 0 });
      }
      const stat = courseStats.get(res.courseId);
      stat.total++;
      if (res.marks === 0) stat.zeros++;
    }

    const unenteredCourses = [];
    for (const [courseId, stat] of Array.from(courseStats.entries())) {
      if (stat.total > 0 && stat.zeros === stat.total) {
        unenteredCourses.push(courseId);
      }
    }

    if (unenteredCourses.length > 0) {
      // Get course names for the error
      const missingCoursesData = await db.select({ title: courses.title })
        .from(courses)
        .where(inArray(courses.id, unenteredCourses));
      
      const missingTitles = missingCoursesData.map(c => c.title).join(", ");
      return errorResponse(`Missing Marks! Teachers have not entered any marks for: ${missingTitles}`, 400);
    }

    // 4. Update the results to published and calculate PASS/FAIL
    // We can do this in bulk using a raw SQL update or mapping them.
    // For simplicity with Drizzle, we can do:
    // UPDATE Result SET published = true, status = CASE WHEN marks >= 40 THEN 'PASS' ELSE 'FAIL' END WHERE userId IN (...) AND published = false
    
    await db.execute(sql`
      UPDATE "Result"
      SET 
          published = true,
          "graceMarksAdded" = CASE 
            WHEN "internalMarks" >= 14 AND "externalMarks" >= 24 AND "externalMarks" < 26 THEN 26 - "externalMarks"
            ELSE 0
          END,
          "marks" = CASE 
            WHEN "internalMarks" >= 14 AND "externalMarks" >= 24 AND "externalMarks" < 26 THEN "internalMarks" + 26
            ELSE "marks"
          END,
          "externalMarks" = CASE 
            WHEN "internalMarks" >= 14 AND "externalMarks" >= 24 AND "externalMarks" < 26 THEN 26
            ELSE "externalMarks"
          END,
          status = CASE 
            WHEN "internalMarks" >= 14 AND "externalMarks" >= 24 THEN 'PASS' 
            ELSE 'FAIL' 
          END
      WHERE "userId" IN ${sql`(${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`}
      AND published = false
    `);

    // Recalculate GPAs and auto-assign learning paths
    for (const studentId of studentIds) {
      await recalculateStudentGpas(studentId);
      
      const failedResults = await db.select({ courseId: results.courseId })
        .from(results)
        .where(and(
          eq(results.userId, studentId),
          eq(results.semester, semester),
          eq(results.status, "FAIL")
        ));
      
      for (const fr of failedResults) {
        if (fr.courseId) {
          await assignLearningPathOnFail(studentId, fr.courseId);
        }
      }
    }

    return successResponse(null, "Results successfully declared for the batch!", 200);

  } catch (error) {
    console.error("Declare Results Error", error);
    return errorResponse("Internal error", 500);
  }
}
