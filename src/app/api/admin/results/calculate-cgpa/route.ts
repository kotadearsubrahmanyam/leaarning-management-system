import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, studentSemesterSummary, users, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

const getGradePoints = (grade: string): number => {
  const g = grade.toUpperCase().trim();
  if (["A+", "O"].includes(g)) return 10;
  if (g === "A") return 9;
  if (g === "B+") return 8;
  if (g === "B") return 7;
  if (g === "C") return 6;
  if (g === "D") return 5;
  return 0; // F
};

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { departmentId, semester } = body;
    if (!departmentId || !semester) return errorResponse("Missing fields", 400);

    // 1. Get all students in dept & sem
    const students = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.departmentId, departmentId), eq(users.semester, semester)));

    if (students.length === 0) return errorResponse("No students found", 404);

    let processedCount = 0;

    for (const student of students) {
      // Fetch all published results for this student
      const allResults = await db.select({
        id: results.id,
        semester: results.semester,
        grade: results.grade,
        credits: courses.credits,
        status: results.status
      })
      .from(results)
      .leftJoin(courses, eq(results.courseId, courses.id))
      .where(and(eq(results.userId, student.id), eq(results.published, true)));

      // Calculate SGPA for the target semester
      const semResults = allResults.filter(r => r.semester === semester);
      if (semResults.length === 0) continue; // Skip if no results

      const semCredits = semResults.reduce((sum, r) => sum + (r.credits || 3), 0);
      const semPoints = semResults.reduce((sum, r) => sum + (getGradePoints(r.grade) * (r.credits || 3)), 0);
      const sgpa = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : "0.00";

      // Calculate CGPA cumulatively (all results <= target semester)
      const cumulativeResults = allResults.filter(r => r.semester <= semester);
      const totalCredits = cumulativeResults.reduce((sum, r) => sum + (r.credits || 3), 0);
      const totalPoints = cumulativeResults.reduce((sum, r) => sum + (getGradePoints(r.grade) * (r.credits || 3)), 0);
      const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

      // Calculate Backlogs and Status
      // Calculate Backlogs and Status (Max 2 backlogs to pass semester overall)
      const backlogCount = semResults.filter(r => r.status === "FAIL").length;
      const status = backlogCount <= 2 ? "PASS" : "FAIL";

      // Check if summary exists
      const existing = await db.query.studentSemesterSummary.findFirst({
        where: and(
          eq(studentSemesterSummary.userId, student.id),
          eq(studentSemesterSummary.semester, semester)
        )
      });

      if (existing) {
        await db.update(studentSemesterSummary).set({
          sgpa, cgpa, status, backlogCount, published: true
        }).where(eq(studentSemesterSummary.id, existing.id));
      } else {
        await db.insert(studentSemesterSummary).values({
          userId: student.id,
          semester,
          sgpa, cgpa, status, backlogCount, published: true
        });
      }
      processedCount++;
    }

    return successResponse(null, `Successfully calculated CGPA for ${processedCount} students.`, 200);

  } catch (error) {
    console.error("CGPA Calculation Error", error);
    return errorResponse("Internal error", 500);
  }
}
