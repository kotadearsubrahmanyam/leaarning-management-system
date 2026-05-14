import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: results.id,
        marks: results.marks,
        grade: results.grade,
        courseName: courses.title,
        semester: courses.semester,
      })
      .from(results)
      .innerJoin(courses, eq(results.courseId, courses.id))
      .where(eq(results.userId, payload.id as string))
      .orderBy(desc(results.createdAt));

    const mappedData = data.map(r => ({
      ...r,
      isPass: r.marks >= 40
    }));

    return successResponse({ results: mappedData }, "Fetched results successfully");
  } catch (error) {
    console.error("Fetch results error:", error);
    return errorResponse("Internal server error", 500);
  }
}
