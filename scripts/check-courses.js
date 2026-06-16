const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT u.email, c.id, c.title 
      FROM "Course" c 
      JOIN "User" u ON c."teacherId" = u.id 
      WHERE u.email = 'csefaculty1@test.com'
    `);
    console.log('Owned:', res.rows);

    const res2 = await pool.query(`
      SELECT c.id, c.title 
      FROM "CourseFaculty" cf 
      JOIN "User" u ON cf."teacherId" = u.id 
      JOIN "Course" c ON cf."courseId" = c.id 
      WHERE u.email = 'csefaculty1@test.com'
    `);
    console.log('Co-teacher:', res2.rows);
  } finally {
    process.exit(0);
  }
}

run();
