const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // We must update in this specific order
    // Fix User.rollNumber (e.g. 24CSE001 -> 23CSE001)
    await pool.query(`UPDATE "User" SET "rollNumber" = regexp_replace("rollNumber", '^24', '23') WHERE "rollNumber" LIKE '24%' AND role = 'STUDENT'`);
    await pool.query(`UPDATE "User" SET "rollNumber" = regexp_replace("rollNumber", '^25', '24') WHERE "rollNumber" LIKE '25%' AND role = 'STUDENT'`);
    await pool.query(`UPDATE "User" SET "rollNumber" = regexp_replace("rollNumber", '^26', '25') WHERE "rollNumber" LIKE '26%' AND role = 'STUDENT'`);
    await pool.query(`UPDATE "User" SET "rollNumber" = regexp_replace("rollNumber", '^27', '26') WHERE "rollNumber" LIKE '27%' AND role = 'STUDENT'`);

    // Fix Result.studentRollNumber
    await pool.query(`UPDATE "Result" SET "studentRollNumber" = regexp_replace("studentRollNumber", '^24', '23') WHERE "studentRollNumber" LIKE '24%'`);
    await pool.query(`UPDATE "Result" SET "studentRollNumber" = regexp_replace("studentRollNumber", '^25', '24') WHERE "studentRollNumber" LIKE '25%'`);
    await pool.query(`UPDATE "Result" SET "studentRollNumber" = regexp_replace("studentRollNumber", '^26', '25') WHERE "studentRollNumber" LIKE '26%'`);
    await pool.query(`UPDATE "Result" SET "studentRollNumber" = regexp_replace("studentRollNumber", '^27', '26') WHERE "studentRollNumber" LIKE '27%'`);

    console.log("Database rollNumber and studentRollNumber fields updated!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
