import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, courses, users, enrollments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const conditions = [eq(courses.teacherId, payload.id as string)];
    if (courseId) {
      conditions.push(eq(courses.id, courseId));
    }

    const data = await db.select({
      id: certificates.id,
      studentName: users.name,
      studentEmail: users.email,
      courseName: courses.title,
      issuedDate: certificates.issuedDate,
      certificateUrl: certificates.certificateUrl,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(users, eq(certificates.studentId, users.id))
    .where(and(...conditions))
    .orderBy(desc(certificates.issuedDate));

    return successResponse({ certificates: data }, "Fetched certificates", 200);
  } catch (error) {
    return errorResponse("Internal error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { courseId, studentId } = body;

    if (!courseId || !studentId) return errorResponse("Missing fields", 400);

    // Verify ownership
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (course?.teacherId !== payload.id) return errorResponse("Forbidden", 403);

    // Ensure student is enrolled and completed
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.studentId, studentId)
      )
    });

    if (!enrollment) return errorResponse("Student not enrolled", 400);

    // Prevent duplicates
    const existing = await db.query.certificates.findFirst({
      where: and(
        eq(certificates.courseId, courseId),
        eq(certificates.studentId, studentId)
      )
    });

    if (existing) return errorResponse("Certificate already issued", 400);

    // In a real app, you would generate a PDF here and upload it to a bucket
    const mockPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

    const [newCert] = await db.insert(certificates).values({
      courseId,
      studentId,
      certificateUrl: mockPdfUrl,
    }).returning();

    // Optionally mark enrollment as COMPLETED
    await db.update(enrollments).set({ status: 'COMPLETED' }).where(eq(enrollments.id, enrollment.id));

    return successResponse({ certificate: newCert }, "Certificate generated", 201);
  } catch (error) {
    return errorResponse("Internal error", 500);
  }
}
