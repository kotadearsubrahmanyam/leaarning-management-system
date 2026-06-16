const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const id = 'f648c76b-e137-4270-9fb2-c8ca868c0825'; // csefaculty2
    
    // Test the logic that stats api uses
    const res = await pool.query(`SELECT id, "courseId" FROM "CourseFaculty" WHERE "teacherId" = $1`, [id]);
    console.log("Faculties:", res.rows);
    
    const cfIds = res.rows.map(r => r.id);
    
    // How many students enrolled?
    if (cfIds.length > 0) {
      const p = await pool.query(`SELECT count(*) FROM "Enrollment" WHERE "courseFacultyId" = ANY($1)`, [cfIds]);
      console.log("Students enrolled:", p.rows);
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
