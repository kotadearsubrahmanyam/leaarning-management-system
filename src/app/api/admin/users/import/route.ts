import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, importHistory, courses } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { roleType, records } = body;

    if (!roleType || !Array.isArray(records) || records.length === 0) {
      return errorResponse("Missing required fields or empty records list.", 400);
    }

    // Lookup admin's name
    const [adminUser] = await db.select().from(users).where(eq(users.id, payload.id));
    const uploaderName = adminUser ? `${adminUser.name} (${adminUser.email})` : payload.email;

    // Hashing password takes ~100ms. Hashing it once and reusing the hash is a massive performance optimization!
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let createdCount = 0;
    let failedCount = 0;
    const importedCredentials: Array<{ rollNumber: string; username: string; name: string; email: string }> = [];

    // Process all users
    for (const rec of records) {
      try {
        // Double check database duplicates inside loop to handle race conditions
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, rec.email.toLowerCase()));
        
        if (existing) {
          failedCount++;
          continue;
        }

        if (rec.rollNumber) {
          const [existingRoll] = await db
            .select()
            .from(users)
            .where(eq(users.rollNumber, rec.rollNumber));
          if (existingRoll) {
            failedCount++;
            continue;
          }
        }

        // Insert user
        const [newUser] = await db.insert(users).values({
          name: rec.name,
          email: rec.email.toLowerCase(),
          password: hashedPassword,
          role: roleType === "STUDENT" ? "STUDENT" : "TEACHER",
          departmentId: rec.departmentId || null,
          semester: roleType === "STUDENT" ? (rec.semester || 1) : null,
          rollNumber: rec.rollNumber || null,
        }).returning();

        if (newUser) {
          createdCount++;
          importedCredentials.push({
            rollNumber: newUser.rollNumber || "",
            username: newUser.rollNumber || "",
            name: newUser.name,
            email: newUser.email,
          });

          // Teacher course mapping/subject assignment
          if (roleType === "TEACHER" && rec.subject) {
            const subjectTitle = rec.subject.trim();
            // Check if course with same title and department exists
            const existingCourses = await db
              .select()
              .from(courses)
              .where(
                and(
                  eq(courses.title, subjectTitle),
                  eq(courses.categoryId, rec.departmentId)
                )
              );

            if (existingCourses.length > 0) {
              // Map teacher to first matching course
              await db
                .update(courses)
                .set({ teacherId: newUser.id })
                .where(eq(courses.id, existingCourses[0].id));
            } else {
              // Create new course for this teacher
              await db.insert(courses).values({
                title: subjectTitle,
                description: `${subjectTitle} course for department faculty.`,
                level: "Intermediate",
                semester: 1,
                credits: 3,
                categoryId: rec.departmentId || null,
                teacherId: newUser.id,
              });
            }
          }
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error("Failed to insert record:", rec, err);
        failedCount++;
      }
    }

    // Write ImportHistory log
    await db.insert(importHistory).values({
      uploadedBy: uploaderName,
      createdCount,
      failedCount,
      status: createdCount > 0 ? "COMPLETED" : "FAILED",
      roleType,
    });

    return successResponse({
      createdCount,
      failedCount,
      credentials: importedCredentials,
    }, "Bulk user creation completed");

  } catch (error: any) {
    console.error("Bulk import execution error:", error);
    return errorResponse("Internal server error", 500);
  }
}
