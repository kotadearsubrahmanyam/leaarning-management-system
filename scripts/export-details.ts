import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, courses, departments } from "../src/db/schema";
import { loadEnvConfig } from "@next/env";
import { eq, and, asc } from "drizzle-orm";
import fs from "fs";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log("Fetching university details...");

  let markdownContent = "# University Academic Structure\n\n";

  const depts = await db.select().from(departments).orderBy(asc(departments.name));

  for (const dept of depts) {
    markdownContent += `## Department: ${dept.name}\n\n`;

    const oddSemesters = [1, 3, 5, 7];

    for (const sem of oddSemesters) {
      markdownContent += `### Semester ${sem}\n\n`;

      // Fetch Faculty & Courses
      markdownContent += `#### Faculty & Courses\n`;
      markdownContent += `| Course Title | Faculty Name | Faculty Email |\n`;
      markdownContent += `|---|---|---|\n`;

      const semCourses = await db.select({
        title: courses.title,
        facultyName: users.name,
        facultyEmail: users.email
      })
      .from(courses)
      .innerJoin(users, eq(courses.teacherId, users.id))
      .where(and(eq(courses.categoryId, dept.id), eq(courses.semester, sem)))
      .orderBy(asc(courses.title));

      if (semCourses.length === 0) {
        markdownContent += `| (No active courses) | - | - |\n`;
      } else {
        for (const c of semCourses) {
          markdownContent += `| ${c.title} | ${c.facultyName} | ${c.facultyEmail} |\n`;
        }
      }
      markdownContent += `\n`;

      // Fetch Students
      markdownContent += `#### Enrolled Students\n`;
      markdownContent += `| Roll Number | Student Name | Student Email |\n`;
      markdownContent += `|---|---|---|\n`;

      const semStudents = await db.select({
        rollNumber: users.rollNumber,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(and(
        eq(users.role, "STUDENT"), 
        eq(users.departmentId, dept.id), 
        eq(users.semester, sem)
      ))
      .orderBy(asc(users.rollNumber));

      if (semStudents.length === 0) {
        markdownContent += `| (No students) | - | - |\n`;
      } else {
        for (const s of semStudents) {
          markdownContent += `| ${s.rollNumber} | ${s.name} | ${s.email} |\n`;
        }
      }
      markdownContent += `\n---\n\n`;
    }
  }

  fs.writeFileSync("university_details.md", markdownContent);
  console.log("✅ Successfully exported to university_details.md");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to export:", err);
  process.exit(1);
});
