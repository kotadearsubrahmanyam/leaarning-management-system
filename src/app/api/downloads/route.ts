export const dynamic = "force-dynamic";

import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/db";
import { downloads, materials, courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    if (payload.role !== "STUDENT") {
      return errorResponse("Forbidden", 403);
    }

    const userDownloads = await db
      .select({
        id: downloads.id,
        title: materials.title,
        courseName: courses.title,
        size: materials.size,
        fileUrl: materials.fileUrl,
        downloadedAt: downloads.downloadedAt,
      })
      .from(downloads)
      .innerJoin(materials, eq(downloads.materialId, materials.id))
      .innerJoin(courses, eq(materials.courseId, courses.id))
      .where(eq(downloads.userId, payload.id as string))
      .orderBy(desc(downloads.downloadedAt));

    const formattedDownloads = userDownloads.map((d) => ({
      id: d.id,
      title: d.title,
      courseName: d.courseName,
      size: d.size,
      status: "downloaded",
      downloadedAt: d.downloadedAt.toISOString(),
      fileUrl: d.fileUrl,
    }));

    return successResponse({ downloads: formattedDownloads }, "Fetched offline content successfully", 200);
  } catch (error) {
    console.error("Fetch downloads error:", error);
    return errorResponse("Internal server error", 500);
  }
}
