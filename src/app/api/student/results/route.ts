export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, studentSemesterSummary, courses, departments, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, desc } from "drizzle-orm";

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

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;

    // Fetch all courses for the student's department to resolve subject codes deterministically
    const studentData = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    let deptCourses: any[] = [];
    if (studentData?.departmentId) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, studentData.departmentId)
      });
      const rawCourses = await db
        .select({
          id: courses.id,
          title: courses.title,
          semester: courses.semester,
        })
        .from(courses)
        .where(eq(courses.categoryId, studentData.departmentId));
        
      const coursesBySem: Record<number, any[]> = {};
      rawCourses.forEach(c => {
        if (!coursesBySem[c.semester]) coursesBySem[c.semester] = [];
        coursesBySem[c.semester].push(c);
      });
      
      const deptCode = (dept?.description?.split(" ")[0] || "SUBJ").toUpperCase();
      
      Object.keys(coursesBySem).forEach(semStr => {
        const sem = parseInt(semStr);
        coursesBySem[sem].sort((a, b) => a.title.localeCompare(b.title));
        coursesBySem[sem].forEach((c, index) => {
          const codeNum = 101 + index;
          c.subjectCode = `${deptCode}${sem}${codeNum.toString().slice(1)}`;
        });
      });
      
      deptCourses = rawCourses;
    }

    // 1. Fetch all subject results (both published and unpublished) for this student with course details
    const dbResultsRaw = await db
      .select({
        result: results,
        course: courses,
      })
      .from(results)
      .leftJoin(courses, eq(results.courseId, courses.id))
      .where(eq(results.userId, userId))
      .orderBy(desc(results.createdAt));

    const dbResults = dbResultsRaw.map(row => {
      const r = row.result;
      const c = row.course;
      const resolvedCourse = deptCourses.find(dc => dc.id === r.courseId);
      return {
        ...r,
        credits: r.credits || c?.credits || 3,
        subjectName: r.subjectName || c?.title || "Subject",
        subjectCode: r.subjectCode || resolvedCourse?.subjectCode || "N/A",
      };
    });

    // 2. Fetch all published semester summaries for this student
    const dbSummaries = await db
      .select()
      .from(studentSemesterSummary)
      .where(and(
        eq(studentSemesterSummary.userId, userId),
        eq(studentSemesterSummary.published, true)
      ));

    // 3. Find which semesters have published results
    const uniqueSemesters = Array.from(new Set(dbResults.filter(r => r.published).map(r => r.semester))).sort((a, b) => a - b);

    // 4. Build summaries (calculating or overriding SGPA / CGPA) for each semester
    const summaries: Record<number, { sgpa: string; cgpa: string; totalCredits: number; passedCount: number; failedCount: number; status: string; backlogCount: number }> = {};

    for (const sem of uniqueSemesters) {
      // Find all results for this semester (only count published ones in the official summaries)
      const semResults = dbResults.filter(r => r.semester === sem && r.published);
      const totalCredits = semResults.reduce((sum, r) => {
        const creditsVal = typeof r.credits === 'number' ? r.credits : parseFloat(r.credits as any) || 0;
        return sum + creditsVal;
      }, 0);
      const passedCount = semResults.filter(r => r.status === "PASS").length;
      const failedCount = semResults.filter(r => r.status === "FAIL").length;

      const summary = dbSummaries.find(s => s.semester === sem);

      summaries[sem] = {
        sgpa: summary?.sgpa || "0.00",
        cgpa: summary?.cgpa || "0.00",
        totalCredits,
        passedCount,
        failedCount,
        status: summary?.status || "PASS",
        backlogCount: summary?.backlogCount || failedCount
      };
    }

    const mappedResults = dbResults.map(r => ({
      id: r.id,
      courseId: r.courseId,
      marks: r.marks,
      grade: r.grade,
      courseName: r.subjectName || "Subject",
      subjectCode: r.subjectCode || "N/A",
      internalMarks: r.internalMarks,
      externalMarks: r.externalMarks,
      credits: r.credits,
      semester: r.semester,
      status: r.status,
      isPass: r.status === "PASS",
      published: r.published,
      passType: r.passType,
      clearedSemester: r.clearedSemester,
      attemptNumber: r.attemptNumber,
      originalSemester: r.originalSemester,
      originalGrade: r.originalGrade,
    }));

    return successResponse({
      results: mappedResults,
      summaries,
      publishedSemesters: uniqueSemesters,
    }, "Fetched results successfully");
  } catch (error) {
    console.error("Fetch student results error:", error);
    return errorResponse("Internal server error", 500);
  }
}
