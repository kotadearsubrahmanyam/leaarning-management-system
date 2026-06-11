import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signJwt } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, result.error.flatten().fieldErrors);
    }

    const { email, password, expectedRole } = result.data;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return errorResponse("Invalid credentials", 401);
    }

    if (expectedRole && user.role !== expectedRole) {
      return errorResponse(`Account is not registered as a ${expectedRole.charAt(0) + expectedRole.slice(1).toLowerCase()}`, 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse("Invalid credentials", 401);
    }

    // Generate JWT
    const token = await signJwt({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response = successResponse(
      { user: userWithoutPassword },
      "Logged in successfully",
      200
    );

    // Set cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
