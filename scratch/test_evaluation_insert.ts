import "dotenv/config";
import { db } from "../src/db";
import { blindEvaluations, users, courses } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    // 1. Get a student
    const [student] = await db.select().from(users).where(eq(users.role, "STUDENT")).limit(1);
    // 2. Get a course
    const [course] = await db.select().from(courses).limit(1);
    // 3. Get a teacher
    const [teacher] = await db.select().from(users).where(eq(users.role, "TEACHER")).limit(1);

    if (!student || !course || !teacher) {
      console.error("Missing dummy data for test:", { student: !!student, course: !!course, teacher: !!teacher });
      return;
    }

    console.log("Found dummy data:", {
      studentId: student.id,
      courseId: course.id,
      teacherId: teacher.id
    });

    console.log("Attempting single insert...");
    const [res] = await db.insert(blindEvaluations).values({
      studentId: student.id,
      courseId: course.id,
      facultyId: teacher.id,
      pdfUrl: "/uploads/evaluations/test.pdf",
      status: "PENDING"
    }).returning();

    console.log("Insert success:", res);

    // Clean up test insert
    console.log("Cleaning up test insert...");
    await db.delete(blindEvaluations).where(eq(blindEvaluations.id, res.id));
    console.log("Cleanup success.");

  } catch (error) {
    console.error("Insert failed with error:", error);
  }
}

main().then(() => process.exit(0));
