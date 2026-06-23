export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db.select().from(departments).orderBy(desc(departments.createdAt));
    return successResponse({ departments: data }, "Fetched departments successfully");
  } catch (error) {
    console.error("Fetch departments error:", error);
    return errorResponse("Internal server error", 500);
  }
}
