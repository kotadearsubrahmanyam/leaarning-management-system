const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("=== COURSES AND THEIR OWNERS (EVEN SEMESTERS) ===");
    const res = await pool.query(`
      SELECT c.id, c.title, c.semester, c."teacherId", u.name, u.role
      FROM "Course" c
      LEFT JOIN "User" u ON c."teacherId" = u.id
      WHERE c.semester % 2 = 0
    `);
    console.log(`Found ${res.rows.length} courses in even semesters.`);
    res.rows.forEach(r => {
      console.log(`Course: ${r.title} (Sem: ${r.semester}) - Owner: ${r.name} (${r.role})`);
    });

    console.log("\n=== ALL TEACHERS IN DB ===");
    const resTeachers = await pool.query(`SELECT id, name, role FROM "User" WHERE role = 'TEACHER'`);
    console.log(resTeachers.rows);

    console.log("\n=== ALL ADMINS IN DB ===");
    const resAdmins = await pool.query(`SELECT id, name, role FROM "User" WHERE role = 'ADMIN'`);
    console.log(resAdmins.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
