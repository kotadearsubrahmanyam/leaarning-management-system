const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id FROM "User" WHERE email = 'csefaculty2@test.com'`);
    const teacherId = res.rows[0].id;
    
    const ownedRes = await pool.query(`SELECT id, title, "categoryId", semester FROM "Course" WHERE "teacherId" = $1`, [teacherId]);
    console.log("Owned:", ownedRes.rows);

    const facultyRes = await pool.query(`
      SELECT c.id, c.title, c."categoryId", c.semester 
      FROM "CourseFaculty" cf 
      JOIN "Course" c ON cf."courseId" = c.id 
      WHERE cf."teacherId" = $1
    `, [teacherId]);
    console.log("Faculty records:", facultyRes.rows);
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
