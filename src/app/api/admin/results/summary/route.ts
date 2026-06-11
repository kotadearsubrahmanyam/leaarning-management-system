import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentSemesterSummary } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { userId, semester, sgpa, cgpa } = body;

    if (!userId || semester === undefined) {
      return errorResponse("Missing required fields", 400);
    }

    const sem = parseInt(semester);

    const existingSummary = await db.query.studentSemesterSummary.findFirst({
      where: and(
        eq(studentSemesterSummary.userId, userId),
        eq(studentSemesterSummary.semester, sem)
      ),
    });

    let result;
    if (existingSummary) {
      const [updated] = await db.update(studentSemesterSummary)
        .set({
          sgpa: sgpa !== undefined ? sgpa : existingSummary.sgpa,
          cgpa: cgpa !== undefined ? cgpa : existingSummary.cgpa,
          updatedAt: new Date()
        })
        .where(eq(studentSemesterSummary.id, existingSummary.id))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(studentSemesterSummary).values({
        userId,
        semester: sem,
        sgpa: sgpa || null,
        cgpa: cgpa || null,
        published: false, // default draft
      }).returning();
      result = inserted;
    }

    return successResponse({ summary: result }, "Student semester summary updated successfully");
  } catch (error) {
    console.error("Update summary error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// GET summary details
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const semester = searchParams.get("semester");

    if (userId) {
      if (semester) {
        const summary = await db.query.studentSemesterSummary.findFirst({
          where: and(
            eq(studentSemesterSummary.userId, userId),
            eq(studentSemesterSummary.semester, parseInt(semester))
          ),
        });
        return successResponse({ summary }, "Fetched summary successfully");
      } else {
        const summaries = await db.query.studentSemesterSummary.findMany({
          where: eq(studentSemesterSummary.userId, userId),
        });
        return successResponse({ summaries }, "Fetched summaries successfully");
      }
    }

    // Fetch all summaries
    const summaries = await db.query.studentSemesterSummary.findMany();
    return successResponse({ summaries }, "Fetched all summaries successfully");
  } catch (error) {
    console.error("Fetch summary error:", error);
    return errorResponse("Internal server error", 500);
  }
}
