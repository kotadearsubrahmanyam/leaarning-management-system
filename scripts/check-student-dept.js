const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT * FROM "User" WHERE email = '24cse001@test.com'`);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
