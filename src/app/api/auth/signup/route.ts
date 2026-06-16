import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, departments } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { signJwt } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, result.error.flatten().fieldErrors);
    }

    const { name, email, password, role, departmentId, semester } = result.data;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return errorResponse("User with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let generatedRollNumber = null;

    if (role === "STUDENT" && departmentId) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, departmentId)
      });
      if (dept) {
        // Simple code derivation if missing: first letters of words or first 3 letters
        let code = "STU";
        if (dept.name.includes("Computer Science")) code = "CSE";
        else if (dept.name.includes("Electronics")) code = "ECE";
        else if (dept.name.includes("Business Administration") || dept.name.includes("BBA")) code = "BBA";
        else code = dept.name.substring(0, 3).toUpperCase();

        const studentCountRaw = await db.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(and(
             eq(users.role, "STUDENT"), 
             eq(users.departmentId, departmentId),
             eq(users.semester, semester || 1)
          ));
        
        const count = studentCountRaw[0]?.count || 0;
        
        const sem = semester || 1;
        const yearPrefix = 27 - Math.floor(sem / 2);
        
        generatedRollNumber = `${yearPrefix}${code}${(count + 1).toString().padStart(3, '0')}`;
      }
    }

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
        departmentId: (role === "STUDENT" || role === "TEACHER") ? departmentId : null,
        semester: role === "STUDENT" ? semester : null,
        rollNumber: generatedRollNumber,
      })
      .returning();

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
      "User created successfully",
      201
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
    console.error("Signup error:", error);
    return errorResponse("Internal server error", 500);
  }
}
