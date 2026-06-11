import { NextResponse } from "next/server";
import { db } from "@/db";
import { courseFaculty, users, enrollments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id;

    // Fetch faculties and their current enrollment count
    const faculties = await db
      .select({
        id: courseFaculty.id,
        capacity: courseFaculty.capacity,
        teacherId: users.id,
        teacherName: users.name,
        teacherEmail: users.email,
        enrolledCount: sql<number>`count(${enrollments.id})::int`
      })
      .from(courseFaculty)
      .innerJoin(users, eq(courseFaculty.teacherId, users.id))
      .leftJoin(enrollments, eq(enrollments.courseFacultyId, courseFaculty.id))
      .where(eq(courseFaculty.courseId, courseId))
      .groupBy(courseFaculty.id, users.id);

    return NextResponse.json({ success: true, faculties }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch course faculties:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
