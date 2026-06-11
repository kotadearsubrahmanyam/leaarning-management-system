import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, inArray, sql } from "drizzle-orm";
import { results, courseFaculty, enrollments } from "@/db/schema";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const semesterStr = searchParams.get("semester");

    if (!departmentId || !semesterStr) {
      return errorResponse("Missing departmentId or semester", 400);
    }

    const semester = parseInt(semesterStr);

    // 1. Fetch Courses for this Dept & Semester
    const fetchedCoursesRaw = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      level: courses.level,
    })
    .from(courses)
    .where(and(
      eq(courses.categoryId, departmentId),
      eq(courses.semester, semester)
    ));

    const fetchedCourses = await Promise.all(fetchedCoursesRaw.map(async (course) => {
      const faculties = await db.select({
        id: courseFaculty.id,
        capacity: courseFaculty.capacity,
        facultyName: users.name,
        facultyEmail: users.email,
        enrolledCount: sql<number>`count(${enrollments.id})::int`
      })
      .from(courseFaculty)
      .innerJoin(users, eq(courseFaculty.teacherId, users.id))
      .leftJoin(enrollments, eq(enrollments.courseFacultyId, courseFaculty.id))
      .where(eq(courseFaculty.courseId, course.id))
      .groupBy(courseFaculty.id, users.id);
      
      return { ...course, faculties };
    }));

    // 2. Fetch Students for this Dept & Semester
    const fetchedStudents = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      rollNumber: users.rollNumber,
    })
    .from(users)
    .where(and(
      eq(users.role, "STUDENT"),
      eq(users.departmentId, departmentId),
      eq(users.semester, semester)
    ));

    // 3. Batch Stats for Promotion
    let unpublishedCount = 0;
    let missingMarksCoursesCount = 0;
    let detainedCount = 0;

    if (fetchedStudents.length > 0) {
      const studentIds = fetchedStudents.map(s => s.id);

      const unpublished = await db.select({ courseId: results.courseId, marks: results.marks })
        .from(results)
        .where(and(inArray(results.userId, studentIds), eq(results.published, false)));
      
      unpublishedCount = unpublished.length;

      const courseStats = new Map();
      for (const res of unpublished) {
        if (!res.courseId) continue;
        if (!courseStats.has(res.courseId)) courseStats.set(res.courseId, { total: 0, zeros: 0 });
        const stat = courseStats.get(res.courseId);
        stat.total++;
        if (res.marks === 0) stat.zeros++;
      }
      for (const stat of Array.from(courseStats.values())) {
        if (stat.total > 0 && stat.zeros === stat.total) missingMarksCoursesCount++;
      }

      if (studentIds.length > 0) {
        const inStudentIds = sql`(${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`;
        const backlogsRes = await db.execute(sql`
          SELECT "userId", COUNT(*) as backlogs
          FROM "Result"
          WHERE "userId" IN ${inStudentIds} AND status = 'FAIL' AND published = true
          GROUP BY "userId"
          HAVING COUNT(*) > 2
        `);
        detainedCount = backlogsRes.rows.length;
      }
    }

    return successResponse({ 
      courses: fetchedCourses,
      students: fetchedStudents,
      stats: {
        unpublishedCount,
        missingMarksCoursesCount,
        detainedCount
      }
    }, "Fetched academic overview successfully", 200);

  } catch (error) {
    console.error("Academic Overview Error", error);
    return errorResponse("Internal error", 500);
  }
}
