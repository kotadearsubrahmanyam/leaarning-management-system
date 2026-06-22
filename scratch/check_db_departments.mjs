import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const depts = await pool.query('SELECT * FROM "Department"');
    console.log("DEPARTMENTS IN DB:");
    console.table(depts.rows);

    const coursesCount = await pool.query('SELECT count(*), "categoryId" FROM "Course" GROUP BY "categoryId"');
    console.log("COURSES COUNT BY DEPT IN DB:");
    console.table(coursesCount.rows);

    const usersCount = await pool.query('SELECT count(*), role, "departmentId" FROM "User" GROUP BY role, "departmentId"');
    console.log("USERS COUNT BY ROLE & DEPT IN DB:");
    console.table(usersCount.rows);

  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
