import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const studentCerts = await db
      .select({
        id: certificates.id,
        courseName: courses.title,
        issuedDate: certificates.issuedDate,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.studentId, payload.id as string));

    return successResponse({ certificates: studentCerts }, "Fetched certificates successfully", 200);
  } catch (error) {
    console.error("Student Certificates GET Error", error);
    return errorResponse("Internal error", 500);
  }
}
