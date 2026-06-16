const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Get csefaculty1 ID
    const f1Res = await pool.query(`SELECT id FROM "User" WHERE email = 'csefaculty1@test.com'`);
    const f1Id = f1Res.rows[0].id;

    // Get another faculty ID (e.g. csefaculty2)
    const f2Res = await pool.query(`SELECT id FROM "User" WHERE email = 'csefaculty2@test.com'`);
    const f2Id = f2Res.rows[0].id;

    console.log('F1:', f1Id, 'F2:', f2Id);

    // Keep Engineering Mathematics II for F1, reassign the rest to F2
    await pool.query(`
      UPDATE "Course" 
      SET "teacherId" = $1 
      WHERE "teacherId" = $2 AND title != 'Engineering Mathematics II'
    `, [f2Id, f1Id]);

    await pool.query(`
      UPDATE "CourseFaculty" 
      SET "teacherId" = $1 
      WHERE "teacherId" = $2 AND "courseId" NOT IN (
        SELECT id FROM "Course" WHERE title = 'Engineering Mathematics II'
      )
    `, [f2Id, f1Id]);

    console.log("Database updated successfully. csefaculty1 now only teaches Engineering Mathematics II.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
