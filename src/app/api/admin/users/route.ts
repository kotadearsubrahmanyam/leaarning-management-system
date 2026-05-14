import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";
import { departments } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        departmentName: departments.name,
        semester: users.semester,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .orderBy(desc(users.createdAt));

    return successResponse({ users: data }, "Fetched all users successfully");
  } catch (error) {
    console.error("Fetch all users error:", error);
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
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return errorResponse("Missing required fields", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
    }).returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return successResponse({ user: userWithoutPassword }, "User created successfully");
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.code === '23505') {
      return errorResponse("Email already exists", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) return errorResponse("User ID is required", 400);

    // Prevent Admin from deleting themselves
    if (userId === payload.id) {
      return errorResponse("Cannot delete your own admin account", 400);
    }

    await db.delete(users).where(eq(users.id, userId));

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse("Internal server error", 500);
  }
}
