import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { studentId: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { studentId } = params;

    const student = await db.query.users.findFirst({
      where: and(eq(users.id, studentId), eq(users.role, "STUDENT")),
      with: {
        department: true,
        enrollments: {
          with: { course: true }
        },
        attendance: {
          with: { course: true },
          orderBy: (attendance, { desc }) => [desc(attendance.date)],
        },
        results: {
          with: { course: true },
          orderBy: (results, { desc }) => [desc(results.createdAt)],
        },
        activities: {
          orderBy: (activities, { desc }) => [desc(activities.date)],
        },
      },
    });

    if (!student) {
      return errorResponse("Student not found", 404);
    }

    return successResponse({ student }, "Fetched student details successfully");
  } catch (error) {
    console.error("Fetch student details error:", error);
    return errorResponse("Internal server error", 500);
  }
}
