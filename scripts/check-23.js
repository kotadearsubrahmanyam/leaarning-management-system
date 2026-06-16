const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT email FROM "User" WHERE email LIKE '23%' LIMIT 10`);
    console.log("23 emails:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
