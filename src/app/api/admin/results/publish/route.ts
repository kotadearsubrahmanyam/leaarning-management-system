import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, studentSemesterSummary } from "@/db/schema";
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
    const { userId, semester, publish } = body;

    if (!userId || semester === undefined || publish === undefined) {
      return errorResponse("Missing required fields", 400);
    }

    const sem = parseInt(semester);
    const pub = !!publish;

    // 1. Update all subject result records for this student & semester
    await db.update(results)
      .set({ published: pub })
      .where(and(eq(results.userId, userId), eq(results.semester, sem)));

    // 2. Check if a StudentSemesterSummary already exists
    const existingSummary = await db.query.studentSemesterSummary.findFirst({
      where: and(
        eq(studentSemesterSummary.userId, userId),
        eq(studentSemesterSummary.semester, sem)
      ),
    });

    if (existingSummary) {
      await db.update(studentSemesterSummary)
        .set({ published: pub, updatedAt: new Date() })
        .where(eq(studentSemesterSummary.id, existingSummary.id));
    } else {
      await db.insert(studentSemesterSummary).values({
        userId,
        semester: sem,
        published: pub,
      });
    }

    return successResponse(null, `Successfully ${pub ? 'published' : 'unpublished'} results for Semester ${sem}`);
  } catch (error) {
    console.error("Publish results error:", error);
    return errorResponse("Internal server error", 500);
  }
}
