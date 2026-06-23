export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { blindEvaluations } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const assignmentsJson = formData.get("assignments") as string;
    if (!assignmentsJson) return NextResponse.json({ success: false, error: "Missing assignments data" }, { status: 400 });

    const assignments: { studentId: string; courseId: string; facultyId: string; fileName?: string }[] = JSON.parse(assignmentsJson);
    const files = formData.getAll("files") as File[];

    const uploadDir = path.join(process.cwd(), "public", "uploads", "evaluations");
    await mkdir(uploadDir, { recursive: true });

    const inserts = [];

    for (const assignment of assignments) {
      let pdfUrl = "/uploads/evaluations/placeholder.pdf"; // Fallback if no file is provided

      if (assignment.fileName) {
        const file = files.find(f => f.name === assignment.fileName);
        if (file) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const safeName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = path.join(uploadDir, safeName);
          await writeFile(filePath, buffer);
          pdfUrl = `/uploads/evaluations/${safeName}`;
        }
      }

      inserts.push({
        studentId: assignment.studentId,
        courseId: assignment.courseId,
        facultyId: assignment.facultyId,
        pdfUrl,
        status: "PENDING" as const,
      });
    }

    if (inserts.length > 0) {
      await db.insert(blindEvaluations).values(inserts);
    }

    return NextResponse.json({ success: true, message: `Successfully created ${inserts.length} bulk evaluations.` });
  } catch (error: any) {
    console.error("Bulk create evaluations error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
