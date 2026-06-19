import "dotenv/config";
import { db } from "../src/db";
import { users, courses } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { signJwt } from "../src/lib/jwt";

async function main() {
  try {
    // 1. Get an admin user to authenticate
    const [admin] = await db.select().from(users).where(eq(users.role, "ADMIN")).limit(1);
    if (!admin) {
      console.error("No admin user found in database!");
      return;
    }

    // 2. Sign JWT
    const token = await signJwt({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    console.log("Admin user found:", admin.email);
    console.log("Generated token:", token.substring(0, 20) + "...");

    // 3. Get student, course, teacher for assignments payload
    const [student] = await db.select().from(users).where(eq(users.role, "STUDENT")).limit(1);
    const [course] = await db.select().from(courses).limit(1);
    const [teacher] = await db.select().from(users).where(eq(users.role, "TEACHER")).limit(1);

    if (!student || !course || !teacher) {
      console.error("Missing dummy data:", { student: !!student, course: !!course, teacher: !!teacher });
      return;
    }

    // 4. Create FormData
    const formData = new FormData();
    const assignments = [
      {
        studentId: student.id,
        courseId: course.id,
        facultyId: teacher.id,
        fileName: "test_exam_paper.pdf"
      }
    ];

    formData.append("assignments", JSON.stringify(assignments));
    
    // Add dummy PDF file
    const fileContent = new Blob(["%PDF-1.4 ... dummy content"], { type: "application/pdf" });
    formData.append("files", fileContent as any, "test_exam_paper.pdf");

    console.log("Sending POST request to localhost:3000/api/admin/evaluations/bulk...");
    const res = await fetch("http://localhost:3000/api/admin/evaluations/bulk", {
      method: "POST",
      body: formData,
      headers: {
        Cookie: `token=${token}`
      }
    });

    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);

  } catch (err) {
    console.error("Test request failed:", err);
  }
}

main().then(() => process.exit(0));
