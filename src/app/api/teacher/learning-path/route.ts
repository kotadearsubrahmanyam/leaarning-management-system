import { NextResponse } from "next/server";
import { db } from "@/db";
import { learningPaths, courses, courseFaculty, learningPathResources } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN" && payload.role !== "STUDENT")) {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return errorResponse("Missing courseId", 400);

    const path = await db.query.learningPaths.findFirst({
      where: eq(learningPaths.courseId, courseId),
      with: {
        resources: true,
      }
    });

    if (path && path.resources) {
      path.resources.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }

    return successResponse({ learningPath: path || null }, "Fetched learning path successfully");
  } catch (error) {
    console.error("GET Learning Path Error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || (payload.role !== "TEACHER" && payload.role !== "ADMIN")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const {
      courseId,
      title,
      description,
      prerequisites,
      studySequence,
      resources,
      mockTests,
    } = body;

    if (!courseId || !title || !studySequence) {
      return errorResponse("Missing required fields", 400);
    }

    // Authorization: Check if teacher manages this course
    if (payload.role === "TEACHER") {
      const isOwner = await db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.teacherId, payload.id as string)),
      });
      const isFaculty = await db.query.courseFaculty.findFirst({
        where: and(eq(courseFaculty.courseId, courseId), eq(courseFaculty.teacherId, payload.id as string)),
      });
      if (!isOwner && !isFaculty) {
        return errorResponse("Forbidden: You do not manage this course", 403);
      }
    }

    const existing = await db.query.learningPaths.findFirst({
      where: eq(learningPaths.courseId, courseId),
    });

    const pathData = {
      courseId,
      title,
      description: description || null,
      prerequisites: prerequisites || null,
      studySequence: typeof studySequence === "string" ? studySequence : JSON.stringify(studySequence),
      resources: resources ? (typeof resources === "string" ? resources : JSON.stringify(resources)) : null,
      mockTests: mockTests ? (typeof mockTests === "string" ? mockTests : JSON.stringify(mockTests)) : null,
      updatedAt: new Date(),
    };

    let savedPath;
    if (existing) {
      const [updated] = await db.update(learningPaths)
        .set(pathData)
        .where(eq(learningPaths.id, existing.id))
        .returning();
      savedPath = updated;
    } else {
      const [inserted] = await db.insert(learningPaths)
        .values(pathData)
        .returning();
      savedPath = inserted;
    }

    // Clean up old resources
    await db.delete(learningPathResources).where(eq(learningPathResources.learningPathId, savedPath.id));

    // Save new resources
    let resourcesList: any[] = [];
    if (Array.isArray(resources)) {
      resourcesList = resources;
    } else if (typeof resources === "string") {
      try {
        const parsed = JSON.parse(resources);
        if (Array.isArray(parsed)) resourcesList = parsed;
      } catch (e) {
        if (resources.trim().length > 0) {
          resourcesList = [{ resourceType: "NOTES", resourceUrl: resources }];
        }
      }
    }

    for (let i = 0; i < resourcesList.length; i++) {
      const resObj = resourcesList[i];
      if (resObj && resObj.resourceType && resObj.resourceUrl) {
        await db.insert(learningPathResources).values({
          learningPathId: savedPath.id,
          resourceType: resObj.resourceType,
          resourceUrl: resObj.resourceUrl,
          sequenceOrder: i + 1,
        });
      }
    }

    // Fetch complete path with resources to return
    const completePath = await db.query.learningPaths.findFirst({
      where: eq(learningPaths.id, savedPath.id),
      with: {
        resources: true,
      }
    });

    if (completePath && completePath.resources) {
      completePath.resources.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }

    return successResponse({ learningPath: completePath }, "Learning path saved successfully");
  } catch (error) {
    console.error("POST Learning Path Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
