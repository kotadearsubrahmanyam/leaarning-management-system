import dotenv from 'dotenv';
import pg from 'pg';
import { SignJWT } from "jose";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  let client;
  try {
    client = await pool.connect();
    // 1. Get admin user
    const adminRes = await client.query("SELECT * FROM \"User\" WHERE role = 'ADMIN' LIMIT 1");
    const admin = adminRes.rows[0];
    if (!admin) {
      console.error("No admin user found!");
      return;
    }

    // 2. Sign JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      id: admin.id,
      email: admin.email,
      role: admin.role
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    console.log("Admin user found:", admin.email);

    // 3. Get student, course, teacher
    const studentRes = await client.query("SELECT * FROM \"User\" WHERE role = 'STUDENT' LIMIT 1");
    const courseRes = await client.query("SELECT * FROM \"Course\" LIMIT 1");
    const teacherRes = await client.query("SELECT * FROM \"User\" WHERE role = 'TEACHER' LIMIT 1");

    const student = studentRes.rows[0];
    const course = courseRes.rows[0];
    const teacher = teacherRes.rows[0];

    if (!student || !course || !teacher) {
      console.error("Missing data:", { student: !!student, course: !!course, teacher: !!teacher });
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
    formData.append("files", fileContent, "test_exam_paper.pdf");

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
    console.error("Test failed:", err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main();
