import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";

const getAutoGrade = (total: number): string => {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B+";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
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

    const internal = parseInt(internalMarks);
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

    const internal = internalMarks !== undefined ? parseInt(internalMarks) : existingResult.internalMarks;
    const external = externalMarks !== undefined ? parseInt(externalMarks) : existingResult.externalMarks;
    const total = internal + external;

    const calculatedGrade = customGrade || ( (internalMarks !== undefined || externalMarks !== undefined) ? getAutoGrade(total) : existingResult.grade );
    const calculatedStatus = customStatus || ( (internalMarks !== undefined || externalMarks !== undefined || customGrade !== undefined) ? (total >= 40 && calculatedGrade !== "F" ? "PASS" : "FAIL") : existingResult.status );

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

    const [updatedResult] = await db.update(results)
      .set(updateData)
      .where(eq(results.id, id))
      .returning();

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
