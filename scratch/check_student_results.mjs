import { db } from "../src/db/index.ts";
import { users, results, studentSemesterSummary, enrollments, courses } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
    const student = await db.select().from(users).where(eq(users.email, "27cse001@test.com"));
    if (student.length === 0) {
        console.log("Student 27cse001@test.com not found!");
        return;
    }
    const s = student[0];
    console.log(`Student: ID=${s.id}, Email=${s.email}, Sem=${s.semester}, Roll=${s.rollNumber}`);

    console.log("\n--- SUMMARIES ---");
    const dbSummaries = await db.select().from(studentSemesterSummary).where(eq(studentSemesterSummary.userId, s.id));
    dbSummaries.forEach(sum => {
        console.log(`Sem: ${sum.semester}, SGPA: ${sum.sgpa}, CGPA: ${sum.cgpa}, Published: ${sum.published}`);
    });

    console.log("\n--- RESULTS ---");
    const dbResults = await db.select().from(results).where(eq(results.userId, s.id));
    console.log(`Total results in DB: ${dbResults.length}`);
    dbResults.forEach(r => {
        console.log(`Sem: ${r.semester}, Code: ${r.subjectCode}, Name: ${r.subjectName}, Credits: ${r.credits}, Grade: ${r.grade}, Marks: ${r.marks}, Status: ${r.status}, Published: ${r.published}`);
    });

    console.log("\n--- ENROLLMENTS & COURSES ---");
    const dbEnrollments = await db.select().from(enrollments).where(eq(enrollments.studentId, s.id));
    for (const e of dbEnrollments) {
        const c = await db.select().from(courses).where(eq(courses.id, e.courseId));
        console.log(`Course: ${c[0]?.title}, Credits: ${c[0]?.credits}, Semester: ${c[0]?.semester}, Enrollment Status: ${e.status}`);
    }
}

main().catch(console.error);
