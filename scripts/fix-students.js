const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // We must update in this specific order to avoid Unique Constraint violations on email
    // 24 -> 23
    await pool.query(`UPDATE "User" SET email = replace(email, '24', '23'), name = replace(name, '24', '23') WHERE email LIKE '24%' AND role = 'STUDENT'`);
    // 25 -> 24
    await pool.query(`UPDATE "User" SET email = replace(email, '25', '24'), name = replace(name, '25', '24') WHERE email LIKE '25%' AND role = 'STUDENT'`);
    // 26 -> 25
    await pool.query(`UPDATE "User" SET email = replace(email, '26', '25'), name = replace(name, '26', '25') WHERE email LIKE '26%' AND role = 'STUDENT'`);
    // 27 -> 26
    await pool.query(`UPDATE "User" SET email = replace(email, '27', '26'), name = replace(name, '27', '26') WHERE email LIKE '27%' AND role = 'STUDENT'`);

    // Fix the one student who was incorrectly put into semester 3
    // They are now named 23cse001@test.com
    await pool.query(`UPDATE "User" SET semester = 7 WHERE email = '23cse001@test.com'`);

    console.log("Database roll numbers and semester mappings perfectly corrected!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
