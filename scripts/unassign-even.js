const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Unassigning faculty from even semesters...");
    
    // We can just delete the CourseFaculty records where the course's semester is even.
    // This perfectly matches the user's request: "admin will assign it later"
    const res = await pool.query(`
      DELETE FROM "CourseFaculty"
      WHERE "courseId" IN (
        SELECT id FROM "Course" WHERE semester % 2 = 0
      )
    `);
    
    console.log(`Deleted ${res.rowCount} CourseFaculty mappings for even semesters.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
