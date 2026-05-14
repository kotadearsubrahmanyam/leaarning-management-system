import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignments, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

async function isTeacherOfCourse(teacherId: string, courseId: string) {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId)
  });
  return course?.teacherId === teacherId;
}

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    let query = db.select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      courseName: courses.title,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(eq(courses.teacherId, payload.id as string));

    if (courseId) {
       // Only filter if requested
       query = query.where(eq(assignments.courseId, courseId)) as any;
    }

    const data = await query.orderBy(desc(assignments.createdAt));

    return successResponse({ assignments: data }, "Fetched assignments successfully", 200);
  } catch (error) {
    return errorResponse("Internal error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { courseId, title, description, dueDate } = body;

    if (!courseId || !title || !dueDate) return errorResponse("Missing required fields", 400);
    
    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    const [newAssignment] = await db.insert(assignments).values({
      courseId,
      title,
      description,
      dueDate: new Date(dueDate),
    }).returning();

    return successResponse({ assignment: newAssignment }, "Assignment created", 201);
  } catch (error) {
    console.error("Create assignment error", error);
    return errorResponse("Internal error", 500);
  }
}
