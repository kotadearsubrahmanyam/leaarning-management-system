import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

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

    // 1. Fetch Courses for this Dept & Semester, including Faculty details
    const fetchedCourses = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      level: courses.level,
      facultyName: users.name,
      facultyEmail: users.email,
    })
    .from(courses)
    .innerJoin(users, eq(courses.teacherId, users.id))
    .where(and(
      eq(courses.categoryId, departmentId),
      eq(courses.semester, semester)
    ));

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

    return successResponse({ 
      courses: fetchedCourses,
      students: fetchedStudents
    }, "Fetched academic overview successfully", 200);

  } catch (error) {
    console.error("Academic Overview Error", error);
    return errorResponse("Internal error", 500);
  }
}
