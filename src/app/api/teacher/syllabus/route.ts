import { NextResponse } from "next/server";
import { db } from "@/db";
import { syllabus, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, asc } from "drizzle-orm";

async function isTeacherOfCourse(teacherId: string, courseId: string) {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId)
  });
  return course?.teacherId === teacherId;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    
    if (!courseId) return errorResponse("Missing courseId", 400);

    const data = await db.select()
      .from(syllabus)
      .where(eq(syllabus.courseId, courseId))
      .orderBy(asc(syllabus.order));

    return successResponse({ syllabus: data }, "Fetched syllabus successfully", 200);
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
    const { courseId, title } = body;

    if (!courseId || !title) return errorResponse("Missing fields", 400);
    
    const isOwner = await isTeacherOfCourse(payload.id as string, courseId);
    if (!isOwner) return errorResponse("Forbidden", 403);

    // Get max order
    const existing = await db.select().from(syllabus).where(eq(syllabus.courseId, courseId));
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(s => s.order)) + 1 : 0;

    const [newItem] = await db.insert(syllabus).values({
      courseId,
      title,
      order: nextOrder,
    }).returning();

    return successResponse({ item: newItem }, "Added to syllabus", 201);
  } catch (error) {
    return errorResponse("Internal error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { items } = body; // Array of { id, order }

    // Optimization: Bulk update or sequential since lists are short
    for (const item of items) {
       await db.update(syllabus).set({ order: item.order }).where(eq(syllabus.id, item.id));
    }

    return successResponse(null, "Reordered successfully", 200);
  } catch (error) {
    return errorResponse("Internal error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return errorResponse("Missing id", 400);

    await db.delete(syllabus).where(eq(syllabus.id, id));

    return successResponse(null, "Deleted successfully", 200);
  } catch (error) {
    return errorResponse("Internal error", 500);
  }
}
