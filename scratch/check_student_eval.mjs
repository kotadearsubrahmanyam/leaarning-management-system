import { db } from "../src/db/index.js";
import { users, courses, blindEvaluations, results } from "../src/db/schema.js";
import { eq, like } from "drizzle-orm";

async function main() {
  console.log("--- SCANNING FOR STUDENT 25CSE002 ---");
  
  // Find student
  const student = await db.query.users.findFirst({
    where: eq(users.rollNumber, "25CSE002")
  });
  
  if (!student) {
    console.log("Error: Student 25CSE002 not found.");
    process.exit(1);
  }
  console.log(`Student Found: ID=${student.id}, Name=${student.name}, Roll=${student.rollNumber}, Sem=${student.semester}, Dept=${student.departmentId}`);

  // Find all blind evaluations for this student
  const evals = await db.query.blindEvaluations.findMany({
    where: eq(blindEvaluations.studentId, student.id),
    with: {
      course: true,
      faculty: true
    }
  });

  console.log(`\nBlind Evaluations count for this student: ${evals.length}`);
  evals.forEach(e => {
    console.log(`- Eval ID: ${e.id}`);
    console.log(`  Course ID: ${e.courseId} (${e.course?.title}, Code: ${e.course?.id?.substring(0, 6).toUpperCase()})`);
    console.log(`  Status: ${e.status}, Marks: ${e.marks}, Faculty: ${e.faculty?.name}`);
  });

  // Find all results for this student
  const resList = await db.query.results.findMany({
    where: eq(results.userId, student.id)
  });
  console.log(`\nResults count in Results table for this student: ${resList.length}`);
  resList.forEach(r => {
    console.log(`- Result ID: ${r.id}, Course ID: ${r.courseId}, Code: ${r.subjectCode}, Name: ${r.subjectName}, Marks: ${r.marks}, Grade: ${r.grade}, Status: ${r.status}`);
  });

  console.log("\n--- ALL COURSES IN SYSTEM ---");
  const allCourses = await db.query.courses.findMany();
  allCourses.forEach(c => {
    console.log(`- Course ID: ${c.id}, Title: ${c.title}, Sem: ${c.semester}, Dept: ${c.categoryId}`);
  });

  console.log("\n--- ALL BLIND EVALUATIONS IN SYSTEM ---");
  const allEvals = await db.query.blindEvaluations.findMany({
    with: {
      student: true,
      course: true
    }
  });
  allEvals.forEach(e => {
    console.log(`- Eval ID: ${e.id}, Student: ${e.student?.rollNumber} (${e.studentId}), Course: ${e.course?.title} (${e.courseId}), Status: ${e.status}, Marks: ${e.marks}`);
  });

  process.exit(0);
}

main().catch(console.error);
