const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- SCANNING FOR STUDENT 25CSE002 ---");
  
  // Find student
  const studentRes = await pool.query('SELECT * FROM "User" WHERE "rollNumber" = $1', ["25CSE002"]);
  const student = studentRes.rows[0];
  
  if (!student) {
    console.log("Error: Student 25CSE002 not found.");
    process.exit(1);
  }
  console.log(`Student Found: ID=${student.id}, Name=${student.name}, Roll=${student.rollNumber}, Sem=${student.semester}, Dept=${student.departmentId}`);

  // Find all blind evaluations for this student
  const evalsRes = await pool.query('SELECT e.*, c.title as course_title, u.name as faculty_name FROM "BlindEvaluation" e LEFT JOIN "Course" c ON e."courseId" = c.id LEFT JOIN "User" u ON e."facultyId" = u.id WHERE e."studentId" = $1', [student.id]);
  const evals = evalsRes.rows;

  console.log(`\nBlind Evaluations count for this student: ${evals.length}`);
  evals.forEach(e => {
    console.log(`- Eval ID: ${e.id}`);
    console.log(`  Course ID: ${e.courseId} (${e.course_title})`);
    console.log(`  Status: ${e.status}, Marks: ${e.marks}, Faculty: ${e.faculty_name}`);
  });

  // Find all results for this student
  const resListRes = await pool.query('SELECT * FROM "Result" WHERE "userId" = $1', [student.id]);
  const resList = resListRes.rows;
  console.log(`\nResults count in Results table for this student: ${resList.length}`);
  resList.forEach(r => {
    console.log(`- Result ID: ${r.id}, Course ID: ${r.courseId}, Code: ${r.subjectCode}, Name: ${r.subjectName}, Marks: ${r.marks}, Grade: ${r.grade}, Status: ${r.status}`);
  });

  console.log("\n--- ALL BLIND EVALUATIONS IN DB ---");
  const allEvalsRes = await pool.query('SELECT e.*, s."rollNumber" as student_roll, c.title as course_title FROM "BlindEvaluation" e LEFT JOIN "User" s ON e."studentId" = s.id LEFT JOIN "Course" c ON e."courseId" = c.id');
  allEvalsRes.rows.forEach(e => {
    console.log(`- Eval ID: ${e.id}, Student: ${e.student_roll} (${e.studentId}), Course: ${e.course_title} (${e.courseId}), Status: ${e.status}, Marks: ${e.marks}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
