const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id FROM "User" WHERE email = 'csefaculty3@test.com'`);
    const id = res.rows[0].id;
    const cf = await pool.query(`SELECT id, "courseId" FROM "CourseFaculty" WHERE "teacherId" = $1`, [id]);
    console.log('Faculties:', cf.rows);
    const cfIds = cf.rows.map(r => r.id);
    if (cfIds.length > 0) {
      const p = await pool.query(`SELECT count(*) FROM "Enrollment" WHERE "courseFacultyId" = ANY($1::uuid[])`, [cfIds]);
      console.log('Students:', p.rows);
    } else {
      console.log('No cfIds');
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
