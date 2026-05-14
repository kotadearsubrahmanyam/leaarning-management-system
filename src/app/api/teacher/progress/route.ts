import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, enrollments, materials, materialProgress, attendance } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, sql, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) return errorResponse("Missing courseId", 400);

    // Get all enrolled students
    const enrolledStudents = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.courseId, courseId));

    // Get total materials for course
    const totalMaterials = await db.select({ id: materials.id }).from(materials).where(eq(materials.courseId, courseId));
    const totalMatsCount = totalMaterials.length;

    // Get progress and attendance for each student
    const progressData = await Promise.all(enrolledStudents.map(async (student) => {
      // Material progress
      const completedMats = await db.select({ id: materialProgress.id })
        .from(materialProgress)
        .innerJoin(materials, eq(materialProgress.materialId, materials.id))
        .where(and(
          eq(materialProgress.studentId, student.id),
          eq(materials.courseId, courseId),
          eq(materialProgress.isCompleted, true)
        ));
      
      const progressPct = totalMatsCount > 0 ? Math.round((completedMats.length / totalMatsCount) * 100) : 0;

      // Attendance
      const attendanceRecords = await db.select({ status: attendance.status })
        .from(attendance)
        .where(and(
          eq(attendance.courseId, courseId),
          eq(attendance.userId, student.id)
        ));
      
      const totalClasses = attendanceRecords.length;
      const attendedClasses = attendanceRecords.filter(a => a.status === 'PRESENT').length;
      const attendancePct = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      return {
        ...student,
        progressPct,
        attendancePct,
        totalClasses,
        attendedClasses
      };
    }));

    return successResponse({ progress: progressData }, "Fetched progress successfully", 200);
  } catch (error) {
    console.error("Progress GET Error", error);
    return errorResponse("Internal error", 500);
  }
}
