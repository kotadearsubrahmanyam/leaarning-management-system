const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("=== COURSE TABLE ===");
    const resCourses = await pool.query('SELECT COUNT(*) FROM "Course"');
    console.log(`Total courses: ${resCourses.rows[0].count}`);

    const resSems = await pool.query('SELECT semester, COUNT(*) FROM "Course" GROUP BY semester ORDER BY semester');
    console.log("Courses by semester:", resSems.rows);

    const resTeacherId = await pool.query('SELECT COUNT(*), COUNT("teacherId") FROM "Course"');
    console.log("Courses with teacherId:", resTeacherId.rows[0]);

    console.log("\n=== COURSEFACULTY TABLE ===");
    const resCF = await pool.query('SELECT COUNT(*) FROM "CourseFaculty"');
    console.log(`Total CourseFaculty records: ${resCF.rows[0].count}`);

    const resCFSems = await pool.query(`
      SELECT c.semester, COUNT(cf.id) 
      FROM "CourseFaculty" cf
      JOIN "Course" c ON cf."courseId" = c.id
      GROUP BY c.semester
      ORDER BY c.semester
    `);
    console.log("CourseFaculty records by course semester:", resCFSems.rows);

    const resUnassigned = await pool.query(`
      SELECT c.id, c.title, c.semester, c."teacherId", u.name as teacherName
      FROM "Course" c
      LEFT JOIN "User" u ON c."teacherId" = u.id
      WHERE c.semester % 2 = 0
      LIMIT 5
    `);
    console.log("Sample even semester courses:", resUnassigned.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
