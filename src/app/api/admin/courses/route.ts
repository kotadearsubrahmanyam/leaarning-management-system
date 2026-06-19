import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, users, departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        level: courses.level,
        semester: courses.semester,
        teacherName: users.name,
        departmentName: departments.name,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .leftJoin(users, eq(courses.teacherId, users.id))
      .leftJoin(departments, eq(courses.categoryId, departments.id))
      .orderBy(desc(courses.createdAt));

    return successResponse({ courses: data }, "Fetched courses successfully");
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
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { title, description, level, teacherId, categoryId } = body;

    if (!title || !teacherId) return errorResponse("Title and Teacher are required", 400);

    // Faculty Overload Check
    const existingAssignments = await db.select()
      .from(courses)
      .where(eq(courses.teacherId, teacherId));
      
    if (existingAssignments.length >= 4) {
      return errorResponse("Faculty Teaching Load Exceeded. A faculty member can only be assigned to a maximum of 4 courses per semester.", 403);
    }

    const [course] = await db.insert(courses).values({
      title,
      description,
      level: level || "Beginner",
      teacherId,
      categoryId: categoryId || null,
    }).returning();

    return successResponse({ course }, "Course created successfully");
  } catch (error) {
    console.error("Create course error:", error);
    return errorResponse("Internal server error", 500);
  }
}
