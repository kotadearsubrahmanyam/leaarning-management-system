const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id, email, role FROM "User" WHERE email = 'csefaculty3@test.com'`);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
