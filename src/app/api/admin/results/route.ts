import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, users, resultAttempts } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";
import { recalculateStudentGpas, assignLearningPathOnFail } from "@/lib/gpa";

const getAutoGrade = (total: number): string => {
  if (total >= 90) return "O";
  if (total >= 80) return "A+";
  if (total >= 70) return "A";
  if (total >= 60) return "B+";
  if (total >= 50) return "B";
  if (total >= 45) return "C";
  if (total >= 40) return "D";
  return "F";
};

// GET all results
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: results.id,
        userId: results.userId,
        studentName: results.studentName,
        studentRollNumber: results.studentRollNumber,
        semester: results.semester,
        subjectCode: results.subjectCode,
        subjectName: results.subjectName,
        internalMarks: results.internalMarks,
        externalMarks: results.externalMarks,
        classInternal: results.classInternal,
        classExternal: results.classExternal,
        mid1: results.mid1,
        mid2: results.mid2,
        assignmentMarks: results.assignmentMarks,
        marks: results.marks,
        credits: results.credits,
        grade: results.grade,
        status: results.status,
        published: results.published,
        createdAt: results.createdAt,
        userRollNumber: users.rollNumber,
        userName: users.name,
      })
      .from(results)
      .leftJoin(users, eq(results.userId, users.id))
      .orderBy(desc(results.createdAt));

    // Normalize name/rollNumber if null in record but available in User
    const normalizedData = data.map(r => ({
      ...r,
      studentName: r.studentName || r.userName || "N/A",
      studentRollNumber: r.studentRollNumber || r.userRollNumber || "N/A",
    }));

    return successResponse({ results: normalizedData }, "Fetched all results successfully");
  } catch (error) {
    console.error("Fetch all results error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST create result
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const {
      userId,
      semester,
      subjectCode,
      subjectName,
      internalMarks,
      externalMarks,
      credits,
      grade: customGrade,
      status: customStatus,
    } = body;

    if (!userId || !semester || !subjectCode || !subjectName || internalMarks === undefined || externalMarks === undefined || credits === undefined) {
      return errorResponse("Missing required fields", 400);
    }

    const internal = 0; // Admins are blocked from setting internal marks
    const external = parseInt(externalMarks);
    const total = internal + external;

    const calculatedGrade = customGrade || getAutoGrade(total);
    const calculatedStatus = customStatus || (total >= 40 && calculatedGrade !== "F" ? "PASS" : "FAIL");

    // Fetch student info
    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!student) {
      return errorResponse("Student user not found", 404);
    }

    const [newResult] = await db.insert(results).values({
      userId,
      studentName: student.name,
      studentRollNumber: student.rollNumber,
      semester: parseInt(semester),
      subjectCode,
      subjectName,
      internalMarks: internal,
      externalMarks: external,
      marks: total,
      credits: parseInt(credits),
      grade: calculatedGrade,
      status: calculatedStatus,
      published: false, // default to unpublished draft
      originalSemester: parseInt(semester),
      attemptNumber: 1,
      passType: "REGULAR",
    }).returning();

    return successResponse({ result: newResult }, "Result added successfully");
  } catch (error) {
    console.error("Add result error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT edit result
export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const {
      id,
      semester,
      subjectCode,
      subjectName,
      internalMarks,
      externalMarks,
      credits,
      grade: customGrade,
      status: customStatus,
      published,
    } = body;

    if (!id) return errorResponse("Result ID is required", 400);

    const existingResult = await db.query.results.findFirst({
      where: eq(results.id, id),
    });

    if (!existingResult) return errorResponse("Result not found", 404);

    const internal = existingResult.internalMarks; // Admins are blocked from editing internal marks
    const external = externalMarks !== undefined ? parseInt(externalMarks) : existingResult.externalMarks;
    const total = internal + external;

    const calculatedGrade = customGrade || ( (externalMarks !== undefined) ? getAutoGrade(total) : existingResult.grade );
    const calculatedStatus = customStatus || ( (externalMarks !== undefined || customGrade !== undefined) ? (total >= 40 && calculatedGrade !== "F" ? "PASS" : "FAIL") : existingResult.status );

    const updateData: any = {};
    if (semester !== undefined) updateData.semester = parseInt(semester);
    if (subjectCode !== undefined) updateData.subjectCode = subjectCode;
    if (subjectName !== undefined) updateData.subjectName = subjectName;
    updateData.internalMarks = internal;
    updateData.externalMarks = external;
    updateData.marks = total;
    if (credits !== undefined) updateData.credits = parseInt(credits);
    updateData.grade = calculatedGrade;
    updateData.status = calculatedStatus;
    if (published !== undefined) updateData.published = published;

    // Check if status changed from FAIL to PASS (Supplementary Cleared)
    const wasFailed = existingResult.status === "FAIL";
    const isNowPassed = calculatedStatus === "PASS";

    if (wasFailed && isNowPassed) {
      // 1. Fetch student info to get current semester
      const student = await db.query.users.findFirst({
        where: eq(users.id, existingResult.userId)
      });
      const currentSem = student?.semester || existingResult.semester;

      // 2. Insert into attempt history
      await db.insert(resultAttempts).values({
        resultId: existingResult.id,
        attemptNumber: existingResult.attemptNumber || 1,
        grade: existingResult.grade,
        status: existingResult.status,
        marks: existingResult.marks,
        semester: existingResult.semester,
      });

      // 3. Mark updateData as supplementary
      updateData.passType = "SUPPLEMENTARY";
      updateData.clearedSemester = currentSem;
      updateData.attemptNumber = (existingResult.attemptNumber || 1) + 1;
      updateData.originalSemester = existingResult.originalSemester || existingResult.semester;
      updateData.originalGrade = existingResult.originalGrade || existingResult.grade;
    } else if (calculatedStatus === "FAIL" && existingResult.status !== "FAIL") {
      updateData.originalSemester = existingResult.originalSemester || existingResult.semester;
      updateData.attemptNumber = existingResult.attemptNumber || 1;
      updateData.passType = "REGULAR";
    }

    const [updatedResult] = await db.update(results)
      .set(updateData)
      .where(eq(results.id, id))
      .returning();

    // Trigger GPA recalculation for this student if status changed or published status changed
    const statusChanged = existingResult.status !== calculatedStatus;
    const publishChanged = existingResult.published !== published;
    const isPublished = published !== undefined ? published : existingResult.published;

    if (statusChanged || publishChanged || isPublished) {
      await recalculateStudentGpas(existingResult.userId);
      
      // Auto assign learning path if failed and published
      if (calculatedStatus === "FAIL" && isPublished) {
        await assignLearningPathOnFail(existingResult.userId, existingResult.courseId || "");
      }
    }

    return successResponse({ result: updatedResult }, "Result updated successfully");
  } catch (error) {
    console.error("Update result error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE result
export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("Result ID is required", 400);

    await db.delete(results).where(eq(results.id, id));

    return successResponse(null, "Result deleted successfully");
  } catch (error) {
    console.error("Delete result error:", error);
    return errorResponse("Internal server error", 500);
  }
}
