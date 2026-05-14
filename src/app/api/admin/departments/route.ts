import { NextResponse } from "next/server";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    // Allow ADMIN and TEACHER to fetch departments
    if (!payload || (payload.role !== "ADMIN" && payload.role !== "TEACHER")) {
      return errorResponse("Forbidden", 403);
    }

    const data = await db.select().from(departments).orderBy(desc(departments.createdAt));

    return successResponse({ departments: data }, "Fetched departments successfully");
  } catch (error) {
    console.error("Fetch departments error:", error);
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

    const body = await req.json();
    const { name, description } = body;

    if (!name) return errorResponse("Department name is required", 400);

    const [department] = await db.insert(departments).values({
      name,
      description,
    }).returning();

    return successResponse({ department }, "Department created successfully");
  } catch (error) {
    console.error("Create department error:", error);
    return errorResponse("Internal server error", 500);
  }
}
