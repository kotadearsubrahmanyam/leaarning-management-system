const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT c.title as course, u.email as teacher
      FROM "Course" c 
      JOIN "User" u ON c."teacherId" = u.id 
      JOIN "Department" d ON c."categoryId" = d.id
      WHERE d.name = 'Computer Science and Engineering' 
      AND c.semester = 3
    `);
    console.table(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
