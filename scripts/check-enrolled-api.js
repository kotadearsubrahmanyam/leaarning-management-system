const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT c.title, c.semester, u.name as teacherName
      FROM "Course" c
      JOIN "User" u ON c."teacherId" = u.id
      WHERE c."categoryId" = 'db28174b-7864-452e-9a7e-c01c0d67b62c'
      AND c.semester <= 5
    `);
    console.log("Enrolled Courses:", res.rows.length);
    console.log(res.rows.slice(0, 3)); // show first 3
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
