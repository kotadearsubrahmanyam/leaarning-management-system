import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/db/schema.js";
import { eq, inArray, sql, and } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function run() {
  try {
    const id = 'fbc49766-a69f-4fa8-b5ad-8855cf762836'; // csefaculty3

    const teacherFaculties = await db
      .select({
        cfId: schema.courseFaculty.id,
        courseId: schema.courseFaculty.courseId
      })
      .from(schema.courseFaculty)
      .where(eq(schema.courseFaculty.teacherId, id));

    const cfIds = teacherFaculties.map(f => f.cfId);
    const courseIds = Array.from(new Set(teacherFaculties.map(f => f.courseId)));

    console.log("studentEnrollmentHistory query...");
    const studentEnrollmentHistory = await db
      .select({
        name: sql<string>`to_char(${schema.enrollments.createdAt}, 'Mon')`,
        value: sql<number>`count(*)::int`,
      })
      .from(schema.enrollments)
      .where(inArray(schema.enrollments.courseFacultyId, cfIds))
      .groupBy(sql`to_char(${schema.enrollments.createdAt}, 'Mon'), extract(month from ${schema.enrollments.createdAt})`)
      .orderBy(sql`extract(month from ${schema.enrollments.createdAt})`);
    
    console.log("studentEnrollmentHistory:", studentEnrollmentHistory);

    console.log("coursePopularity query...");
    const coursePopularity = await db
      .select({
        name: schema.courses.title,
        value: sql<number>`count(${schema.enrollments.id})::int`,
      })
      .from(schema.courses)
      .innerJoin(schema.courseFaculty, eq(schema.courseFaculty.courseId, schema.courses.id))
      .leftJoin(schema.enrollments, eq(schema.enrollments.courseFacultyId, schema.courseFaculty.id))
      .where(eq(schema.courseFaculty.teacherId, id))
      .groupBy(schema.courses.id, schema.courses.title)
      .orderBy(sql`count(${schema.enrollments.id}) DESC`)
      .limit(5);

    console.log("coursePopularity:", coursePopularity);
    
  } catch(e) {
    console.error("ERROR:", e);
  } finally {
    process.exit(0);
  }
}

run();
