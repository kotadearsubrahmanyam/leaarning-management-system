export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, courseFaculty } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, or, and, inArray } from "drizzle-orm";

function getYearSemesters(sem: number) {
  if (sem <= 2) return [1, 2];
  if (sem <= 4) return [3, 4];
  if (sem <= 6) return [5, 6];
  return [7, 8];
}

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const teacherId = payload.id as string;

    // Fetch courses owned by the teacher
    const ownedCourses = await db.query.courses.findMany({
      where: eq(courses.teacherId, teacherId)
    });

    // Fetch courses where teacher is faculty
    const facultyRecords = await db.query.courseFaculty.findMany({
      where: eq(courseFaculty.teacherId, teacherId),
      with: {
        course: true
      }
    });

    const facultyCourses = facultyRecords.map(f => f.course).filter(c => c !== null);

    // Combine and deduplicate assigned courses
    const assignedCourses = [...ownedCourses, ...facultyCourses];
    const assignedIds = new Set(assignedCourses.map(c => c.id));
    
    if (assignedCourses.length === 0) {
      return successResponse({ courses: [] }, "Fetched courses successfully", 200);
    }

    // Determine the relevant categories and semesters
    const categories = Array.from(new Set(assignedCourses.map(c => c.categoryId).filter(Boolean))) as string[];
    const relevantSemesters = new Set<number>();
    assignedCourses.forEach(c => {
      getYearSemesters(c.semester).forEach(s => relevantSemesters.add(s));
    });
    const semestersArr = Array.from(relevantSemesters);

    // Fetch the full contextual list of courses for those academic years
    const contextualCourses = await db.query.courses.findMany({
      where: and(
        inArray(courses.categoryId, categories),
        inArray(courses.semester, semestersArr)
      )
    });

    const enrichedCourses = contextualCourses.map(c => ({
      ...c,
      isAssigned: assignedIds.has(c.id)
    }));

    // Sort by semester, then title
    enrichedCourses.sort((a, b) => {
      if (a.semester !== b.semester) return a.semester - b.semester;
      return a.title.localeCompare(b.title);
    });

    return successResponse({ courses: enrichedCourses }, "Fetched courses successfully", 200);

  } catch (error: any) {
    console.error("Fetch Courses error:", error);
    return errorResponse("Internal error", 500);
  }
}
