const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT c.title, c.semester
      FROM "Course" c 
      JOIN "User" u ON c."teacherId" = u.id 
      WHERE u.email = 'csefaculty1@test.com'
    `);
    console.log(res.rows);
  } finally {
    process.exit(0);
  }
}

run();
