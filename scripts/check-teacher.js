const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT u.name, u.semester, d.name as dept
      FROM "User" u 
      LEFT JOIN "Department" d ON u."departmentId" = d.id 
      WHERE u.email = 'csefaculty1@test.com'
    `);
    console.log(res.rows[0]);
  } finally {
    process.exit(0);
  }
}

run();
