import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const teacherRes = await pool.query("SELECT id, name FROM \"User\" WHERE email = 'csefaculty1@test.com'");
    if (teacherRes.rows.length === 0) {
      console.log("Teacher csefaculty1@test.com not found!");
      return;
    }
    const { id, name } = teacherRes.rows[0];
    console.log(`Checking stats for teacher: ${name} (ID: ${id})`);

    // 1. Get cfIds and courseIds (joining with Enrollment)
    const facultyRes = await pool.query(
      `SELECT cf.id as "cfId", cf."courseId" 
       FROM "CourseFaculty" cf
       INNER JOIN "Enrollment" e ON e."courseFacultyId" = cf.id
       WHERE cf."teacherId" = $1
       GROUP BY cf.id, cf."courseId"`,
      [id]
    );

    console.log("Active Course Faculty sections found for this teacher:");
    console.table(facultyRes.rows);

    const cfIds = facultyRes.rows.map(r => r.cfId);
    const courseIds = Array.from(new Set(facultyRes.rows.map(r => r.courseId)));

    console.log(`Active Courses Created/Managed count (should be 1): ${courseIds.length}`);

    // 2. Count enrolled students
    if (cfIds.length > 0) {
      const studentsRes = await pool.query(
        `SELECT count(*)::int FROM "Enrollment" WHERE "courseFacultyId" = ANY($1)`,
        [cfIds]
      );
      console.log(`Active Students Enrolled (should be 20): ${studentsRes.rows[0].count}`);
    } else {
      console.log("Active Students Enrolled: 0");
    }

  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
