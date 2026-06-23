export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Unauthorized", 401);

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "BACKLOG_POLICY"),
    });

    return successResponse({ policy: setting?.value || "A" }, "Fetched backlog policy");
  } catch (error) {
    console.error("GET Backlog Policy Error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { policy } = await req.json();
    if (!policy || !["A", "B", "C"].includes(policy)) {
      return errorResponse("Invalid policy value", 400);
    }

    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "BACKLOG_POLICY"),
    });

    if (existing) {
      await db.update(systemSettings)
        .set({ value: policy, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing.id));
    } else {
      await db.insert(systemSettings).values({
        key: "BACKLOG_POLICY",
        value: policy,
      });
    }

    return successResponse({ policy }, "Backlog GPA policy updated successfully");
  } catch (error) {
    console.error("POST Backlog Policy Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
