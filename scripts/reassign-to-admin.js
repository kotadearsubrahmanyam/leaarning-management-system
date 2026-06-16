const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Reassigning even semester courses to ADMIN...");
    
    // Get admin ID
    const adminRes = await pool.query(`SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1`);
    const adminId = adminRes.rows[0].id;

    // Update the Course table for even semesters to point to Admin
    const res = await pool.query(`
      UPDATE "Course"
      SET "teacherId" = $1
      WHERE semester % 2 = 0
    `, [adminId]);
    
    console.log(`Reassigned ${res.rowCount} Course records to Admin for future assignment.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
