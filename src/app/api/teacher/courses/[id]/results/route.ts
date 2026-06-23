export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, users, enrollments, courseFaculty, courses, blindEvaluations } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const courseId = params.id;
    const teacherId = payload.id as string;

    // Validate course access: Is the teacher owner or mapped as faculty?
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) return errorResponse("Course not found", 404);

    const isOwner = course.teacherId === teacherId;

    const facultySections = await db.query.courseFaculty.findMany({
      where: and(
        eq(courseFaculty.courseId, courseId),
        eq(courseFaculty.teacherId, teacherId)
      ),
    });

    const isFaculty = facultySections.length > 0;

    if (!isOwner && !isFaculty) {
      return errorResponse("Access denied: You are not teaching this course", 403);
    }

    // Fetch enrollments for this course: always filter by the teacher's sections
    const sectionIds = facultySections.map(f => f.id);
    let studentEnrollments: { studentId: string }[] = [];
    if (sectionIds.length === 0) {
      studentEnrollments = [];
    } else {
      studentEnrollments = await db
        .select({ studentId: enrollments.studentId })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, courseId),
            inArray(enrollments.courseFacultyId, sectionIds)
          )
        );
    }

    const studentIds = Array.from(new Set(studentEnrollments.map(e => e.studentId)));

    if (studentIds.length === 0) {
      return successResponse({ students: [] }, "Fetched course results successfully");
    }

    // Fetch student users info
    const studentUsers = await db.query.users.findMany({
      where: inArray(users.id, studentIds),
    });

    // Fetch existing results
    const existingResults = await db.query.results.findMany({
      where: and(
        eq(results.courseId, courseId),
        inArray(results.userId, studentIds)
      ),
    });

    const resultsMap = new Map(existingResults.map(r => [r.userId, r]));

    const students = studentUsers.map(student => {
      const resultRecord = resultsMap.get(student.id);

      return {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        mid1: resultRecord?.mid1 ?? 0,
        mid2: resultRecord?.mid2 ?? 0,
        assignmentMarks: resultRecord?.assignmentMarks ?? 0,
        classInternal: resultRecord?.classInternal ?? 0,
        classExternal: resultRecord?.classExternal ?? 0,
        internalMarks: resultRecord?.internalMarks ?? 0,
        externalMarks: resultRecord?.externalMarks ?? 0,
        marks: resultRecord?.marks ?? 0,
        grade: resultRecord?.grade ?? "F",
        status: resultRecord?.status ?? "FAIL",
        published: resultRecord?.published ?? false,
      };
    });

    return successResponse({ students }, "Fetched course results successfully");
  } catch (error: any) {
    console.error("Fetch course results error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const courseId = params.id;
    const teacherId = payload.id as string;

    // Validate course access
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) return errorResponse("Course not found", 404);

    const isOwner = course.teacherId === teacherId;
    const facultySections = await db.query.courseFaculty.findMany({
      where: and(
        eq(courseFaculty.courseId, courseId),
        eq(courseFaculty.teacherId, teacherId)
      ),
    });

    if (facultySections.length === 0) {
      return errorResponse("Access denied: You are not teaching any sections of this course", 403);
    }

    const body = await req.json();
    const { results: studentResults } = body;

    if (!Array.isArray(studentResults)) {
      return errorResponse("Invalid request body, expected 'results' array", 400);
    }

    for (const item of studentResults) {
      const { studentId, mid1, mid2, assignmentMarks, classExternal } = item;

      if (!studentId) continue;

      const m1 = Math.min(16, Math.max(0, Math.round(Number(mid1 || 0))));
      const m2 = Math.min(24, Math.max(0, Math.round(Number(mid2 || 0))));
      const am = Math.min(10, Math.max(0, Math.round(Number(assignmentMarks || 0))));
      const cInt = m1 + m2 + am; // Sum to max 50
      const cExt = Math.min(50, Math.max(0, Math.round(Number(classExternal || 0)))); // max 50
      const computedInternal = Math.round((cInt + cExt) / 2); // average of classInternal and classExternal (max 50)

      // Find existing Result
      const existingResult = await db.query.results.findFirst({
        where: and(
          eq(results.userId, studentId),
          eq(results.courseId, courseId)
        ),
      });

      // Get externalMarks (Semester end exam halved, max 50): if blind evaluation exists, use it. Otherwise existingResult, or 0.
      let computedExternal = existingResult?.externalMarks ?? 0;
      
      const blindEval = await db.query.blindEvaluations.findFirst({
        where: and(
          eq(blindEvaluations.studentId, studentId),
          eq(blindEvaluations.courseId, courseId)
        ),
      });
      if (blindEval && blindEval.marks !== null) {
        computedExternal = Math.round(blindEval.marks / 2); // Semester end exams are for 100 marks, halved by 2 to make it out of 50
      }

      const totalMarks = computedInternal + computedExternal;

      // Grade calculation out of 100
      const grade = totalMarks >= 90 ? "O" : totalMarks >= 80 ? "A+" : totalMarks >= 70 ? "A" : totalMarks >= 60 ? "B+" : totalMarks >= 50 ? "B" : totalMarks >= 45 ? "C" : totalMarks >= 40 ? "D" : "F";
      const status = totalMarks >= 40 ? "PASS" : "FAIL";

      if (existingResult) {
        await db
          .update(results)
          .set({
            mid1: m1,
            mid2: m2,
            assignmentMarks: am,
            classInternal: cInt,
            classExternal: cExt,
            internalMarks: computedInternal,
            externalMarks: computedExternal,
            marks: totalMarks,
            grade,
            status,
            published: false, // Save as draft
            createdAt: new Date(),
          })
          .where(eq(results.id, existingResult.id));
      } else {
        const studentUser = await db.query.users.findFirst({
          where: eq(users.id, studentId),
        });

        await db.insert(results).values({
          userId: studentId,
          courseId,
          semester: course.semester,
          subjectCode: course.id.substring(0, 6).toUpperCase(),
          subjectName: course.title,
          mid1: m1,
          mid2: m2,
          assignmentMarks: am,
          classInternal: cInt,
          classExternal: cExt,
          internalMarks: computedInternal,
          externalMarks: computedExternal,
          marks: totalMarks,
          credits: course.credits,
          grade,
          status,
          published: false, // Save as draft
          studentName: studentUser?.name || "N/A",
          studentRollNumber: studentUser?.rollNumber || "N/A",
          attemptNumber: 1,
          passType: "REGULAR",
          createdAt: new Date(),
        });
      }
    }

    return successResponse(null, "Internal marks saved as draft successfully");
  } catch (error: any) {
    console.error("Save course results error:", error);
    return errorResponse("Internal server error", 500);
  }
}
