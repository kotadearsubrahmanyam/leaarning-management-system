import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, users, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: results.id,
        marks: results.marks,
        grade: results.grade,
        date: results.createdAt,
        studentName: users.name,
        courseName: courses.title,
      })
      .from(results)
      .innerJoin(users, eq(results.userId, users.id))
      .innerJoin(courses, eq(results.courseId, courses.id))
      .orderBy(desc(results.createdAt));

    return successResponse({ results: data }, "Fetched all results successfully");
  } catch (error) {
    console.error("Fetch all results error:", error);
    return errorResponse("Internal server error", 500);
  }
}
