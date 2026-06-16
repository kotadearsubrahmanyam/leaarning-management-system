const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT c.title, u.email 
      FROM "CourseFaculty" cf 
      JOIN "Course" c ON cf."courseId" = c.id 
      JOIN "User" u ON cf."teacherId" = u.id 
      WHERE c.title = 'Linear Algebra and Calculus'
    `);
    console.table(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
