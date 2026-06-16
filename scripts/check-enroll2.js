const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT u.email 
      FROM "Enrollment" e 
      JOIN "User" u ON e."studentId" = u.id 
      JOIN "Course" c ON e."courseId" = c.id 
      WHERE c.title = 'Engineering Mathematics II'
    `);
    console.log('Students enrolled in Engineering Mathematics II:', res.rows.map(r => r.email));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
