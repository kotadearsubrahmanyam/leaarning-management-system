export const dynamic = "force-dynamic";

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
        departmentId: users.departmentId,
        departmentName: departments.name,
        totalSemesters: departments.totalSemesters,
        typeOfEducation: departments.typeOfEducation,
        semester: users.semester,
        rollNumber: users.rollNumber,
        residentStatus: users.residentStatus,
        isFeeReimbursed: users.isFeeReimbursed,
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
    const { name, email, password, role, departmentId, semester, rollNumber, residentStatus, isFeeReimbursed } = body;

    if (!name || !email || !password || !role) {
      return errorResponse("Missing required fields", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertValues: any = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    };

    if (role === "STUDENT") {
      insertValues.departmentId = departmentId || null;
      insertValues.semester = semester ? parseInt(semester) : null;
      insertValues.rollNumber = rollNumber || null;
      insertValues.residentStatus = residentStatus || "DAYSCHOLAR_NORMAL";
      insertValues.isFeeReimbursed = isFeeReimbursed ?? false;
    } else if (role === "TEACHER") {
      insertValues.departmentId = departmentId || null;
    }

    const [newUser] = await db.insert(users).values(insertValues).returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return successResponse({ user: userWithoutPassword }, "User created successfully");
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.code === '23505') {
      return errorResponse("Email or Roll Number already exists", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { id, name, email, password, role, departmentId, semester, rollNumber, residentStatus, isFeeReimbursed } = body;

    if (!id) return errorResponse("User ID is required", 400);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) return errorResponse("User not found", 404);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    
    if (existingUser.role === "STUDENT" || role === "STUDENT") {
      if (semester !== undefined) updateData.semester = semester ? parseInt(semester) : null;
      if (rollNumber !== undefined) updateData.rollNumber = rollNumber || null;
      if (residentStatus !== undefined) updateData.residentStatus = residentStatus;
      if (isFeeReimbursed !== undefined) updateData.isFeeReimbursed = isFeeReimbursed;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;

    return successResponse({ user: userWithoutPassword }, "User updated successfully");
  } catch (error: any) {
    console.error("Update user error:", error);
    if (error.code === '23505') {
      return errorResponse("Email or Roll Number already exists", 400);
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
