import { NextResponse } from "next/server";
import { db } from "@/db";
import { blindEvaluations, results, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { recalculateStudentGpas } from "@/lib/gpa";
import crypto from "crypto";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const { marks, comments } = await req.json();

    if (marks === undefined || marks < 0 || marks > 100) {
      return NextResponse.json({ success: false, error: "Invalid marks" }, { status: 400 });
    }

    // 1. Find the Blind Evaluation
    const evaluation = await db.query.blindEvaluations.findFirst({
      where: and(
        eq(blindEvaluations.id, id),
        eq(blindEvaluations.facultyId, payload.id as string)
      ),
      with: { course: true }
    });

    if (!evaluation) return NextResponse.json({ success: false, error: "Evaluation not found or unauthorized" }, { status: 404 });
    if (evaluation.status === "EVALUATED") return NextResponse.json({ success: false, error: "Already evaluated" }, { status: 400 });

    // 2. Update the Blind Evaluation status and comments
    await db.update(blindEvaluations)
      .set({ 
        marks: Number(marks), 
        comments: comments || null,
        status: "EVALUATED" 
      })
      .where(eq(blindEvaluations.id, id));

    // 3. Fetch Student Name & Roll Number for Results mapping
    const studentUser = await db.query.users.findFirst({
      where: eq(users.id, evaluation.studentId)
    });
    const studentName = studentUser?.name || "N/A";
    const studentRollNumber = studentUser?.rollNumber || "N/A";

    // Blind evaluation marks are out of 100, which we halve to make it out of 50.
    const scaledExternal = Math.round(Number(marks) / 2);

    // Check if result already exists for this student and course
    const existingResult = await db.query.results.findFirst({
      where: and(
        eq(results.userId, evaluation.studentId),
        eq(results.courseId, evaluation.courseId)
      )
    });

    const cInt = existingResult?.classInternal ?? 0;
    const cExt = existingResult?.classExternal ?? 0;
    const computedInternal = Math.round((cInt + cExt) / 2);
    const totalMarks = computedInternal + scaledExternal;
    
    // Convert to Grade dynamically based on total marks out of 100
    const grade = totalMarks >= 90 ? "O" : totalMarks >= 80 ? "A+" : totalMarks >= 70 ? "A" : totalMarks >= 60 ? "B+" : totalMarks >= 50 ? "B" : totalMarks >= 45 ? "C" : totalMarks >= 40 ? "D" : "F";
    const status = totalMarks >= 40 ? "PASS" : "FAIL";

    if (existingResult) {
      await db.update(results)
        .set({
          studentName,
          studentRollNumber,
          internalMarks: computedInternal,
          externalMarks: scaledExternal,
          marks: totalMarks,
          grade,
          status,
          published: false, // Save as unpublished draft until admin declares
          createdAt: new Date(),
        })
        .where(eq(results.id, existingResult.id));
    } else {
      await db.insert(results).values({
        userId: evaluation.studentId,
        courseId: evaluation.courseId,
        semester: evaluation.course.semester,
        classInternal: cInt,
        classExternal: cExt,
        internalMarks: computedInternal,
        externalMarks: scaledExternal,
        marks: totalMarks,
        grade,
        status,
        credits: evaluation.course.credits,
        studentName,
        studentRollNumber,
        subjectCode: evaluation.course.id.substring(0, 6).toUpperCase(),
        subjectName: evaluation.course.title,
        published: false, // Save as unpublished draft until admin declares
        createdAt: new Date(),
      });
    }

    // Do NOT call recalculateStudentGpas here since the result is unpublished and draft.
    // Recalculation will happen when the admin publishes/declares results.

    return NextResponse.json({ success: true, message: "Marks submitted securely and synced to results as unpublished draft." });
  } catch (error: any) {
    console.error("Submit blind evaluation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
