import { db } from "./src/db";
import { courses, courseFaculty, enrollments, assignments, submissions, users } from "./src/db/schema";
import { eq, inArray, sql, and } from "drizzle-orm";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function run() {
  try {
    const id = 'f648c76b-e137-4270-9fb2-c8ca868c0825'; // csefaculty2

    const teacherFaculties = await db
      .select({
        cfId: courseFaculty.id,
        courseId: courseFaculty.courseId
      })
      .from(courseFaculty)
      .where(eq(courseFaculty.teacherId, id));

    console.log("teacherFaculties:", teacherFaculties);

    const cfIds = teacherFaculties.map(f => f.cfId);
    const courseIds = Array.from(new Set(teacherFaculties.map(f => f.courseId)));

    console.log("cfIds:", cfIds);
    console.log("courseIds:", courseIds);

    const [totalStudentsRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(inArray(enrollments.courseFacultyId, cfIds));
    
    console.log("totalStudentsRes:", totalStudentsRes);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
