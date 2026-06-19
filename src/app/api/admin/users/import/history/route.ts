import { NextResponse } from "next/server";
import { db } from "@/db";
import { importHistory } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    // Fetch history
    const historyList = await db
      .select()
      .from(importHistory)
      .orderBy(desc(importHistory.uploadDate));

    // Calculate aggregated stats
    let totalStudentsImported = 0;
    let totalTeachersImported = 0;
    let latestImportDate: any = null;

    historyList.forEach((h) => {
      if (h.roleType === "STUDENT") {
        totalStudentsImported += h.createdCount;
      } else if (h.roleType === "TEACHER") {
        totalTeachersImported += h.createdCount;
      }
      
      if (!latestImportDate || h.uploadDate > latestImportDate) {
        latestImportDate = h.uploadDate;
      }
    });

    return successResponse({
      history: historyList,
      stats: {
        totalStudentsImported,
        totalTeachersImported,
        latestImportDate: latestImportDate ? latestImportDate.toISOString() : null,
        totalImportsCount: historyList.length,
      }
    }, "Import history and stats fetched successfully");

  } catch (error) {
    console.error("Fetch import history error:", error);
    return errorResponse("Internal server error", 500);
  }
}
