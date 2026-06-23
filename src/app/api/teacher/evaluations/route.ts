export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { blindEvaluations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "TEACHER") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const records = await db.query.blindEvaluations.findMany({
      where: eq(blindEvaluations.facultyId, payload.id as string),
      with: {
        course: true,
      },
      orderBy: [desc(blindEvaluations.createdAt)]
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error("Fetch teacher evaluations error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
