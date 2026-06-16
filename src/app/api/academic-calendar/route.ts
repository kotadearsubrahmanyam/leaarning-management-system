import { NextResponse } from "next/server";
import { db } from "@/db";
import { academicEvents, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, desc, asc } from "drizzle-orm";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  category: z.enum(["MILESTONE", "EXAM", "HOLIDAY", "CO_CURRICULAR"]),
  semester: z.number().int().min(1).max(8).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");
    const semesterFilter = searchParams.get("semester");

    let conditions = [];
    if (categoryFilter) {
      conditions.push(eq(academicEvents.category, categoryFilter));
    }
    if (semesterFilter) {
      conditions.push(eq(academicEvents.semester, parseInt(semesterFilter)));
    }

    const query = db
      .select()
      .from(academicEvents)
      .orderBy(asc(academicEvents.startDate));

    const events = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return successResponse({ events }, "Academic events fetched successfully", 200);
  } catch (error) {
    console.error("Fetch academic calendar error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return errorResponse("Forbidden: Admins only", 403);
    }

    const body = await req.json();
    const parseResult = eventSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse("Validation error", 400, parseResult.error.flatten().fieldErrors);
    }

    const data = parseResult.data;
    const newEvent = await db
      .insert(academicEvents)
      .values({
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        category: data.category,
        semester: data.semester || null,
        createdBy: payload.id as string,
      })
      .returning();

    return successResponse({ event: newEvent[0] }, "Academic event created successfully", 201);
  } catch (error) {
    console.error("Create academic event error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return errorResponse("Forbidden: Admins only", 403);
    }

    const body = await req.json();
    const { id, ...eventData } = body;
    if (!id) return errorResponse("Event ID is required", 400);

    const parseResult = eventSchema.safeParse(eventData);
    if (!parseResult.success) {
      return errorResponse("Validation error", 400, parseResult.error.flatten().fieldErrors);
    }

    const data = parseResult.data;
    const updatedEvent = await db
      .update(academicEvents)
      .set({
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        category: data.category,
        semester: data.semester || null,
        createdBy: payload.id as string,
      })
      .where(eq(academicEvents.id, id))
      .returning();

    if (updatedEvent.length === 0) {
      return errorResponse("Event not found", 404);
    }

    return successResponse({ event: updatedEvent[0] }, "Academic event updated successfully", 200);
  } catch (error) {
    console.error("Update academic event error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return errorResponse("Forbidden: Admins only", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("Event ID is required", 400);

    const deletedEvent = await db
      .delete(academicEvents)
      .where(eq(academicEvents.id, id))
      .returning();

    if (deletedEvent.length === 0) {
      return errorResponse("Event not found", 404);
    }

    return successResponse({ event: deletedEvent[0] }, "Academic event deleted successfully", 200);
  } catch (error) {
    console.error("Delete academic event error:", error);
    return errorResponse("Internal server error", 500);
  }
}
