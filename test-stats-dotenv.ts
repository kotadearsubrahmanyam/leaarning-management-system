import { db } from "./src/db/index.js";
import { courses, courseFaculty, enrollments, assignments, submissions, users } from "./src/db/schema.js";
import { eq, inArray, sql, and } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    const id = 'fbc49766-a69f-4fa8-b5ad-8855cf762836'; // csefaculty3

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
    console.error("ERROR:", e);
  } finally {
    process.exit(0);
  }
}

run();
