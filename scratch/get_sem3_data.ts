import "dotenv/config";

import { db } from "../src/db";
import { users, courses } from "../src/db/schema";
import { eq, and, like } from "drizzle-orm";

async function main() {
  try {
    // 1. Get 3rd semester students starting with roll number '25'
    const sem3Students = await db.select({
      id: users.id,
      name: users.name,
      rollNumber: users.rollNumber,
      semester: users.semester,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "STUDENT"),
        like(users.rollNumber, "25%")
      )
    );

    // 2. Get courses for 3rd semester
    const sem3Courses = await db.select({
      id: courses.id,
      title: courses.title,
      semester: courses.semester,
    })
    .from(courses)
    .where(eq(courses.semester, 3));

    console.log("=== STUDENTS (Total: " + sem3Students.length + ") ===");
    console.log(JSON.stringify(sem3Students, null, 2));
    
    console.log("=== COURSES (Total: " + sem3Courses.length + ") ===");
    console.log(JSON.stringify(sem3Courses, null, 2));

  } catch (error) {
    console.error("Error executing query:", error);
  }
}

main().then(() => process.exit(0));
