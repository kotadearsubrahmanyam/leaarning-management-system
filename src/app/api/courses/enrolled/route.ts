export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, users, enrollments, departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    if (payload.role !== "STUDENT") {
      return errorResponse("Forbidden", 403);
    }

    // Fetch student profile details (department and current semester)
    const [student] = await db
      .select({
        departmentId: users.departmentId,
        semester: users.semester,
      })
      .from(users)
      .where(eq(users.id, payload.id as string));

    let fetchedCourses: any[] = [];
    if (student && student.departmentId && student.semester) {
      fetchedCourses = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          level: courses.level,
          imageUrl: courses.imageUrl,
          semester: courses.semester,
          createdAt: courses.createdAt,
          teacherName: users.name,
          status: sql<string>`CASE WHEN ${courses.semester} < ${student.semester} THEN 'COMPLETED' ELSE 'ACTIVE' END`,
          credits: courses.credits,
          departmentDescription: departments.description,
        })
        .from(courses)
        .innerJoin(users, eq(courses.teacherId, users.id))
        .leftJoin(departments, eq(courses.categoryId, departments.id))
        .where(
          and(
            eq(courses.categoryId, student.departmentId),
            sql`${courses.semester} <= ${student.semester}`
          )
        );
    }

    const data = fetchedCourses.map(course => ({
      ...course,
      isEnrolled: true,
      progress: course.status === "COMPLETED" ? 100 : 50, // Completed courses are marked 100%, active are 50%
      subjectCode: "N/A",
    }));

    // Group courses by department and semester to assign sequential codes dynamically
    const coursesByDeptSem: Record<string, typeof data> = {};
    data.forEach(c => {
      const key = `${c.departmentDescription || ""}-${c.semester}`;
      if (!coursesByDeptSem[key]) coursesByDeptSem[key] = [];
      coursesByDeptSem[key].push(c);
    });

    Object.keys(coursesByDeptSem).forEach(key => {
      coursesByDeptSem[key].sort((a, b) => a.title.localeCompare(b.title));
      const [deptDesc] = key.split("-");
      const deptCode = (deptDesc?.split(" ")[0] || "SUBJ").toUpperCase();
      const sem = key.split("-")[1];
      
      coursesByDeptSem[key].forEach((c, index) => {
        const codeNum = 101 + index; // e.g. 101, 102
        c.subjectCode = `${deptCode}${sem}${codeNum.toString().slice(1)}`;
      });
    });

    return successResponse({ courses: data }, "Enrolled courses fetched successfully", 200);
  } catch (error) {
    console.error("Fetch enrolled courses error:", error);
    return errorResponse("Internal server error", 500);
  }
}
