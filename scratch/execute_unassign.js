const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Fetch System Admin ID
    const resAdmin = await pool.query("SELECT id FROM \"User\" WHERE role = 'ADMIN' LIMIT 1");
    if (resAdmin.rows.length === 0) {
      console.error("No admin user found in database!");
      process.exit(1);
    }
    const adminId = resAdmin.rows[0].id;
    console.log(`System Admin ID to use for unassigned courses: ${adminId}`);

    // 2. Delete CourseFaculty mappings for even semesters
    console.log("Deleting CourseFaculty records for even semester courses...");
    const resDel = await pool.query(`
      DELETE FROM "CourseFaculty"
      WHERE "courseId" IN (
        SELECT id FROM "Course" WHERE semester % 2 = 0
      )
    `);
    console.log(`Deleted ${resDel.rowCount} CourseFaculty mappings.`);

    // 3. Update teacherId in Course table for even semesters to the Admin ID
    console.log("Updating Course table: setting teacherId to Admin ID for even semester courses...");
    const resUpd = await pool.query(`
      UPDATE "Course"
      SET "teacherId" = $1
      WHERE semester % 2 = 0
    `, [adminId]);
    console.log(`Updated ${resUpd.rowCount} Course records.`);

    // 4. Verify results
    const resVerifyCF = await pool.query(`
      SELECT COUNT(*) FROM "CourseFaculty" cf
      JOIN "Course" c ON cf."courseId" = c.id
      WHERE c.semester % 2 = 0
    `);
    console.log(`Remaining even semester CourseFaculty records: ${resVerifyCF.rows[0].count}`);

    const resVerifyCourses = await pool.query(`
      SELECT c.title, c.semester, u.name as teacherName, u.role as teacherRole
      FROM "Course" c
      JOIN "User" u ON c."teacherId" = u.id
      WHERE c.semester % 2 = 0
      LIMIT 5
    `);
    console.log("Sample even semester courses after update:", resVerifyCourses.rows);

  } catch (err) {
    console.error("Error executing database unassignment:", err);
  } finally {
    await pool.end();
  }
}

main();
