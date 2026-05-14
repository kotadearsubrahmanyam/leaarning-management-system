import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, courses, payments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, sql } from "drizzle-orm";
import { departments } from "@/db/schema";

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
      .where(eq(payments.status, "PAID"));

    const [{ departmentCount }] = await db
      .select({ departmentCount: sql<number>`count(*)` })
      .from(departments);

    const studentsPerDept = await db
      .select({
        departmentName: departments.name,
        count: sql<number>`count(${users.id})`,
      })
      .from(departments)
      .leftJoin(users, sql`${users.departmentId} = ${departments.id} AND ${users.role} = 'STUDENT'`)
      .groupBy(departments.id, departments.name);

    const stats = {
      totalStudents: Number(studentCount),
      totalTeachers: Number(teacherCount),
      totalCourses: Number(courseCount),
      totalRevenue: Number(totalRevenue),
      totalDepartments: Number(departmentCount),
      studentsPerDept: studentsPerDept.map(d => ({ name: d.departmentName, count: Number(d.count) })),
    };

    return successResponse({ stats }, "Fetched admin stats successfully");
  } catch (error) {
    console.error("Fetch admin stats error:", error);
    return errorResponse("Internal server error", 500);
  }
}
