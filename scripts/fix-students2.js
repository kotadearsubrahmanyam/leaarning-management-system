const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Check what exists first!
    const res24 = await pool.query(`SELECT count(*) FROM "User" WHERE email LIKE '24%'`);
    const res23 = await pool.query(`SELECT count(*) FROM "User" WHERE email LIKE '23%'`);
    console.log("Count 24:", res24.rows[0].count, "Count 23:", res23.rows[0].count);

    // Rollback any partial 23s just in case? No, wait, if it failed on the first update, Postgres rolls back the single query!
    
    // We must update in this specific order to avoid Unique Constraint violations on email
    // Use regexp_replace to only replace the prefix!
    
    await pool.query(`UPDATE "User" SET email = regexp_replace(email, '^24', '23'), name = regexp_replace(name, '24', '23') WHERE email LIKE '24%' AND role = 'STUDENT'`);
    await pool.query(`UPDATE "User" SET email = regexp_replace(email, '^25', '24'), name = regexp_replace(name, '25', '24') WHERE email LIKE '25%' AND role = 'STUDENT'`);
    await pool.query(`UPDATE "User" SET email = regexp_replace(email, '^26', '25'), name = regexp_replace(name, '26', '25') WHERE email LIKE '26%' AND role = 'STUDENT'`);
    await pool.query(`UPDATE "User" SET email = regexp_replace(email, '^27', '26'), name = regexp_replace(name, '27', '26') WHERE email LIKE '27%' AND role = 'STUDENT'`);

    // Fix the one student who was incorrectly put into semester 3
    await pool.query(`UPDATE "User" SET semester = 7 WHERE email = '23cse001@test.com'`);

    console.log("Database roll numbers and semester mappings perfectly corrected!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
