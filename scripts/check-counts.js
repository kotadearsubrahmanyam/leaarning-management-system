const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT count(*) FROM "CourseFaculty"`);
    console.log('CourseFaculty count:', res.rows[0].count);
    
    // Check assignments count
    const aRes = await pool.query(`SELECT count(*) FROM "Assignment"`);
    console.log('Assignment count:', aRes.rows[0].count);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
