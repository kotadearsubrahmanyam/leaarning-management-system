export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ne } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Forbidden", 403);

    // Fetch all users except self
    const data = await db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(ne(users.id, payload.id as string));

    return successResponse({ users: data }, "Fetched users successfully");
  } catch (error) {
    console.error("Fetch users error:", error);
    return errorResponse("Internal server error", 500);
  }
}
