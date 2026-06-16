const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const qRes = await pool.query(`
      SELECT q.title, c.semester, c.title as course 
      FROM "Quiz" q 
      JOIN "Course" c ON q."courseId" = c.id
    `);
    console.log("Quizzes:", qRes.rows);

    const fRes = await pool.query(`
      SELECT count(*) 
      FROM "User" u 
      JOIN "Department" d ON u."departmentId" = d.id 
      WHERE d.name = 'Computer Science and Engineering' AND u.role = 'TEACHER'
    `);
    console.log("CSE Faculty count:", fRes.rows[0].count);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
