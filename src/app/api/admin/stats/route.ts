import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, courses, payments, departments, submissions, quizSubmissions } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    // Fetch Stats
    const [{ studentCount }] = await db
      .select({ studentCount: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "STUDENT"));

    const [{ teacherCount }] = await db
      .select({ teacherCount: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "TEACHER"));

    const [{ courseCount }] = await db
      .select({ courseCount: sql<number>`count(*)` })
      .from(courses);

    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sql<number>`COALESCE(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(sql`${payments.status} IN ('COMPLETED', 'VERIFIED')`);

    const [{ departmentCount }] = await db
      .select({ departmentCount: sql<number>`count(*)` })
      .from(departments);

    const [{ assignmentsSubmitted }] = await db
      .select({ assignmentsSubmitted: sql<number>`count(*)` })
      .from(submissions);

    const [{ quizzesCompleted }] = await db
      .select({ quizzesCompleted: sql<number>`count(*)` })
      .from(quizSubmissions);

    const allDepartments = await db.select().from(departments);
    
    const departmentStatsRaw = await Promise.all(allDepartments.map(async (dept) => {
      const [{ studentCount }] = await db
        .select({ studentCount: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.departmentId} = ${dept.id} AND ${users.role} = 'STUDENT'`);
        
      const [{ teacherCount }] = await db
        .select({ teacherCount: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.departmentId} = ${dept.id} AND ${users.role} = 'TEACHER'`);

      const [{ courseCount }] = await db
        .select({ courseCount: sql<number>`count(*)` })
        .from(courses)
        .where(sql`${courses.categoryId} = ${dept.id}`);

      return {
        name: dept.name,
        studentCount: Number(studentCount),
        teacherCount: Number(teacherCount),
        courseCount: Number(courseCount),
      };
    }));

    const stats = {
      totalStudents: Number(studentCount),
      totalTeachers: Number(teacherCount),
      totalCourses: Number(courseCount),
      totalRevenue: Number(totalRevenue),
      totalDepartments: Number(departmentCount),
      assignmentsSubmitted: Number(assignmentsSubmitted),
      quizzesCompleted: Number(quizzesCompleted),
      departmentStats: departmentStatsRaw,
    };

    return successResponse({ stats }, "Fetched admin stats successfully");
  } catch (error) {
    console.error("Fetch admin stats error:", error);
    return errorResponse("Internal server error", 500);
  }
}
