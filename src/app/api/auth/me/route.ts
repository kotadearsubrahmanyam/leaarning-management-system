import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/db";
import { users, departments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return errorResponse("Invalid token", 401);
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        semester: users.semester,
        departmentId: users.departmentId,
        departmentName: departments.name,
        rollNumber: users.rollNumber,
        residentStatus: users.residentStatus,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(eq(users.id, payload.id as string));

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ user }, "User fetched successfully", 200);
  } catch (error) {
    console.error("Auth me error:", error);
    return errorResponse("Internal server error", 500);
  }
}
