const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Unassigning primary teachers from even semesters...");
    
    // Clear the teacherId on the Course table for even semesters
    const res = await pool.query(`
      UPDATE "Course"
      SET "teacherId" = NULL
      WHERE semester % 2 = 0
    `);
    
    console.log(`Updated ${res.rowCount} Course records for even semesters.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
