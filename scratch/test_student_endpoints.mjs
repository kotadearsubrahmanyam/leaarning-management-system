import pg from 'pg';
import dotenv from 'dotenv';
import { SignJWT } from "jose";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error("The environment variable JWT_SECRET is not set.");
  }
  return secret;
};

const signJwt = async (payload) => {
  const secret = new TextEncoder().encode(getJwtSecretKey());
  const alg = "HS256";
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
};

async function main() {
  try {
    const client = await pool.connect();
    
    // Find student 26cse001@test.com
    const studentRes = await client.query(`
      SELECT id, name, email, "rollNumber", semester, "departmentId"
      FROM "User"
      WHERE email = '25cse001@test.com';
    `);
    
    if (studentRes.rows.length === 0) {
      console.log('Student not found.');
      return;
    }
    
    const student = studentRes.rows[0];
    console.log('Student:', student);
    
    const token = await signJwt({
      id: student.id,
      email: student.email,
      role: 'STUDENT'
    });
    
    console.log('Generated Token:', token);
    
    // Now we can fetch or simulate the handlers. Since we don't want to run the whole next.js server if it's not running, 
    // let's dynamically import the route files and call the GET function!
    // But since Next.js route files import modules with absolute aliases like @/db, we might get resolve errors.
    // Instead, let's just make a real HTTP request to http://localhost:3000/api/student/results and http://localhost:3000/api/courses/enrolled
    // using fetch, passing the token in Cookie: token=...
    // Let's try fetching, but if the server isn't running, we catch the error and show db records.
    try {
      const res1 = await fetch('http://localhost:3000/api/student/results', {
        headers: {
          Cookie: `token=${token}`
        }
      });
      if (res1.ok) {
        const data = await res1.json();
        console.log('API /api/student/results response:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('API /api/student/results error status:', res1.status);
      }
      
      const res2 = await fetch('http://localhost:3000/api/student/payments', {
        headers: {
          Cookie: `token=${token}`
        }
      });
      if (res2.ok) {
        const data = await res2.json();
        console.log('API /api/student/payments response:');
        console.log('Fees items count:', data.data?.fees?.length);
        console.log('Sample Fees structure:');
        console.log(JSON.stringify(data.data?.fees?.slice(0, 5), null, 2));
      } else {
        console.log('API /api/student/payments error status:', res2.status);
      }
    } catch (fetchErr) {
      console.log('Could not connect to localhost:3000 server. Let us query DB mirroring the API logic.');
      // API logic for /api/student/results:
      // 1. Get student's department courses
      const deptCoursesRes = await client.query(`
        SELECT id, title, semester
        FROM "Course"
        WHERE "categoryId" = $1;
      `, [student.departmentId]);
      console.log('Department courses count:', deptCoursesRes.rows.length);
      
      // 2. Get student results
      const resultsRes = await client.query(`
        SELECT r.*, c.title as course_title, c.semester as course_semester, c.credits as course_credits
        FROM "Result" r
        LEFT JOIN "Course" c ON r."courseId" = c.id
        WHERE r."userId" = $1;
      `, [student.id]);
      console.log('Results in DB:', resultsRes.rows.length);
      resultsRes.rows.forEach(r => {
        console.log(r);
      });
    }

    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
