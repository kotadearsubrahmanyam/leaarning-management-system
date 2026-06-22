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

    // 4. Automatically sync to Results table (Magic Sync)
    // We map the hidden studentId to the actual results table.
    const internalMarks = 0; // Or fetch existing internal marks
    const totalMarks = Number(marks) + internalMarks;
    
    // Convert to Grade dynamically
    const grade = totalMarks >= 90 ? "O" : totalMarks >= 80 ? "A+" : totalMarks >= 70 ? "A" : totalMarks >= 60 ? "B+" : totalMarks >= 50 ? "B" : totalMarks >= 45 ? "C" : totalMarks >= 40 ? "P" : "F";
    const status = totalMarks >= 40 ? "PASS" : "FAIL";

    // Check if result already exists for this student and course
    const existingResult = await db.query.results.findFirst({
      where: and(
        eq(results.userId, evaluation.studentId),
        eq(results.courseId, evaluation.courseId)
      )
    });

    if (existingResult) {
      await db.update(results)
        .set({
          studentName,
          studentRollNumber,
          externalMarks: Number(marks),
          marks: totalMarks,
          grade,
          status,
          published: false, // Default to draft (do not auto-publish)
          createdAt: new Date(), // Update timestamp to trigger "Recently Updated" row highlighting
        })
        .where(eq(results.id, existingResult.id));
    } else {
      await db.insert(results).values({
        userId: evaluation.studentId,
        courseId: evaluation.courseId,
        semester: evaluation.course.semester,
        externalMarks: Number(marks),
        marks: totalMarks,
        grade,
        status,
        credits: evaluation.course.credits,
        studentName,
        studentRollNumber,
        subjectCode: evaluation.course.id.substring(0, 6).toUpperCase(),
        subjectName: evaluation.course.title,
        published: false, // Default to draft (do not auto-publish)
        createdAt: new Date(),
      });
    }

    // 5. Automatically recalculate GPA and update summaries
    await recalculateStudentGpas(evaluation.studentId);

    return NextResponse.json({ success: true, message: "Marks submitted securely and synced to results." });
  } catch (error: any) {
    console.error("Submit blind evaluation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
