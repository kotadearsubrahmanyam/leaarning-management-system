import { db } from "../src/db/index.js";
import { users, courses, departments, blindEvaluations, results } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  console.log("--- DIAGNOSTICS START ---");
  
  const allDepts = await db.select().from(departments);
  console.log(`Departments (${allDepts.length}):`);
  allDepts.forEach(d => console.log(`  - ${d.id}: ${d.name}`));

  const allStudents = await db.select().from(users).where(eq(users.role, 'STUDENT'));
  console.log(`Students (${allStudents.length}):`);
  allStudents.forEach(s => console.log(`  - ${s.id}: ${s.name} | Dept: ${s.departmentId} | Sem: ${s.semester} | Roll: ${s.rollNumber}`));

  const allCourses = await db.select().from(courses);
  console.log(`Courses (${allCourses.length}):`);
  allCourses.forEach(c => console.log(`  - ${c.id}: ${c.title} | Category: ${c.categoryId} | Sem: ${c.semester}`));

  const allEvals = await db.select().from(blindEvaluations);
  console.log(`Blind Evaluations (${allEvals.length}):`);
  allEvals.forEach(e => console.log(`  - ID: ${e.id} | Student: ${e.studentId} | Course: ${e.courseId} | Status: ${e.status} | Marks: ${e.marks}`));

  const allResults = await db.select().from(results);
  console.log(`Results (${allResults.length}):`);
  allResults.forEach(r => console.log(`  - ID: ${r.id} | Student: ${r.userId} | Course: ${r.courseId} | Semester: ${r.semester} | Marks: ${r.marks}`));

  console.log("--- DIAGNOSTICS END ---");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
