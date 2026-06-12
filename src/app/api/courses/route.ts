import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, users, enrollments, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  level: z.string().default("Beginner"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const { searchParams } = new URL(req.url);
    const filterTeacher = searchParams.get("teacherOnly") === "true";

    let fetchedCourses: any[];

    if (payload.role === "TEACHER" && filterTeacher) {
      const teacherCourseIds = await db
        .select({ courseId: courseFaculty.courseId })
        .from(courseFaculty)
        .where(eq(courseFaculty.teacherId, payload.id as string));
        
      const ids = teacherCourseIds.map(t => t.courseId);
      
      if (ids.length > 0) {
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
            studentCount: sql<number>`(SELECT count(*)::int FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id})`,
          })
          .from(courses)
          .innerJoin(users, eq(courses.teacherId, users.id))
          .where(inArray(courses.id, ids));
      } else {
        fetchedCourses = [];
      }
    } else if (payload.role === "STUDENT") {
      // Fetch student's specific dept and semester
      const studentData = await db.query.users.findFirst({
        where: eq(users.id, payload.id as string)
      });
      
      let query = db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          level: courses.level,
          imageUrl: courses.imageUrl,
          semester: courses.semester,
          createdAt: courses.createdAt,
          teacherName: users.name,
          studentCount: sql<number>`(SELECT count(*)::int FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id})`,
        })
        .from(courses)
        .innerJoin(users, eq(courses.teacherId, users.id));

      if (studentData?.departmentId && studentData?.semester) {
        query = query.where(
          and(
            eq(courses.categoryId, studentData.departmentId),
            eq(courses.semester, studentData.semester)
          )
        ) as any;
      }
      fetchedCourses = await query;
    } else {
      // ADMIN
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
          studentCount: sql<number>`(SELECT count(*)::int FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id})`,
        })
        .from(courses)
        .innerJoin(users, eq(courses.teacherId, users.id));
    }

    // Also get enrollments for the student
    const studentEnrollments = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.studentId, payload.id as string));
    
    const enrolledIds = studentEnrollments.map(e => e.courseId);

    const data = fetchedCourses.map(course => ({
      ...course,
      isEnrolled: enrolledIds.includes(course.id),
    }));

    return successResponse({ courses: data }, "Courses fetched successfully", 200);
  } catch (error) {
    console.error("Fetch courses error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    if (payload.role !== "TEACHER" && payload.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const result = createCourseSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, result.error.flatten().fieldErrors);
    }

    const newCourse = await db
      .insert(courses)
      .values({
        ...result.data,
        teacherId: payload.id as string,
      })
      .returning();

    return successResponse({ course: newCourse[0] }, "Course created successfully", 201);
  } catch (error) {
    console.error("Create course error:", error);
    return errorResponse("Internal server error", 500);
  }
}
