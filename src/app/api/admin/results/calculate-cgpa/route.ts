export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";
import { recalculateStudentGpas } from "@/lib/gpa";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { departmentId, semester } = body;
    if (!departmentId || !semester) return errorResponse("Missing fields", 400);

    // 1. Get all students in dept & sem
    const students = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.departmentId, departmentId), eq(users.semester, semester)));

    if (students.length === 0) return errorResponse("No students found", 404);

    let processedCount = 0;

    for (const student of students) {
      await recalculateStudentGpas(student.id);
      processedCount++;
    }

    return successResponse(null, `Successfully calculated CGPA for ${processedCount} students.`, 200);

  } catch (error) {
    console.error("CGPA Calculation Error", error);
    return errorResponse("Internal error", 500);
  }
}


