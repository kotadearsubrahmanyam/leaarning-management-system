import { NextResponse } from "next/server";
import { db } from "@/db";
import { blindEvaluations, users, courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function GET() {
  try {
    const records = await db.query.blindEvaluations.findMany({
      with: {
        student: true,
        faculty: true,
        course: true,
      },
      orderBy: [desc(blindEvaluations.createdAt)]
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error("Fetch evaluations error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const studentId = formData.get("studentId") as string;
    const courseId = formData.get("courseId") as string;
    const facultyId = formData.get("facultyId") as string;
    const file = formData.get("file") as File;

    if (!studentId || !courseId || !facultyId || !file) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save File Locally
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, '-')}`;
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", "evaluations");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const pdfUrl = `/uploads/evaluations/${fileName}`;

    // 2. Create DB Record
    const [evaluation] = await db.insert(blindEvaluations).values({
      studentId,
      courseId,
      facultyId,
      pdfUrl,
      status: "PENDING"
    }).returning();

    return NextResponse.json({ success: true, data: evaluation, message: "Blind evaluation created securely." });
  } catch (error: any) {
    console.error("Create evaluation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
