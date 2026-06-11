import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
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
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    // Fetch all students with their relations
    const studentsData = await db.query.users.findMany({
      where: eq(users.role, "STUDENT"),
      with: {
        department: true,
        enrollments: {
          with: { course: true }
        },
        attendance: true,
        activities: true,
      },
    });

    // Map to aggregated format
    const students = studentsData.map(student => {
      const totalAttendance = student.attendance.length;
      const presentDays = student.attendance.filter(a => a.status === "PRESENT").length;
      const attendancePercentage = totalAttendance === 0 ? 0 : Math.round((presentDays / totalAttendance) * 100);
      
      const enrolledCourses = student.enrollments.map(e => e.course.title);
      
      return {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        department: (student.department as any)?.name || "N/A",
        semester: student.semester,
        attendancePercentage,
        activitiesCount: student.activities.length,
        enrolledCourses,
      };
    });

    return successResponse({ students }, "Fetched students successfully");
  } catch (error) {
    console.error("Fetch students error:", error);
    return errorResponse("Internal server error", 500);
  }
}
