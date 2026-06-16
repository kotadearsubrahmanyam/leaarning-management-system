const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id FROM "User" WHERE email = 'csefaculty2@test.com'`);
    console.log(res.rows[0].id);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
