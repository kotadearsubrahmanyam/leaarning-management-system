export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { materialId } = body;

    if (!materialId) {
      return errorResponse("Missing materialId", 400);
    }

    // Check if already downloaded to avoid duplicates
    const existing = await db.query.downloads.findFirst({
      where: and(
        eq(downloads.userId, payload.id),
        eq(downloads.materialId, materialId)
      )
    });

    if (!existing) {
      await db.insert(downloads).values({
        userId: payload.id as string,
        materialId,
      });
    }

    return successResponse(null, "Download tracked successfully");
  } catch (error) {
    console.error("Track download error:", error);
    return errorResponse("Internal server error", 500);
  }
}
