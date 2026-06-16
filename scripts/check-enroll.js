const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT c.title, c.semester 
      FROM "Enrollment" e 
      JOIN "User" u ON e."studentId" = u.id 
      JOIN "Course" c ON e."courseId" = c.id 
      WHERE u.email = '24cse001@test.com'
    `);
    console.log('Enrolled:', res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
