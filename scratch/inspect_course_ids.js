const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- SEARCHING SEMESTER 3 COURSES ---");
  const coursesRes = await pool.query('SELECT id, title, "categoryId", semester FROM "Course" WHERE semester = 3');
  console.log("Courses in Course Table:");
  coursesRes.rows.forEach(c => {
    console.log(`  - ${c.id}: ${c.title} | Dept: ${c.categoryId}`);
  });

  console.log("\n--- SEARCHING BLIND EVALUATIONS FOR STUDENT 25CSE002 ---");
  const studentRes = await pool.query('SELECT id FROM "User" WHERE "rollNumber" = \'25CSE002\'');
  const studentId = studentRes.rows[0].id;
  
  const evalsRes = await pool.query('SELECT * FROM "BlindEvaluation" WHERE "studentId" = $1', [studentId]);
  console.log("Evaluations in BlindEvaluation Table:");
  evalsRes.rows.forEach(e => {
    console.log(`  - ID: ${e.id} | StudentId: ${e.studentId} | CourseId: ${e.courseId} | Status: ${e.status} | Marks: ${e.marks}`);
  });

  process.exit(0);
}

main().catch(console.error);
