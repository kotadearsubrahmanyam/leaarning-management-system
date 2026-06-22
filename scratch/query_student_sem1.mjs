import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    
    // Find student 26cse001@test.com
    const studentRes = await client.query(`
      SELECT id, name, email, "rollNumber", semester, "departmentId"
      FROM "User"
      WHERE email = '26cse001@test.com';
    `);
    
    if (studentRes.rows.length === 0) {
      console.log('Student 26cse001@test.com not found.');
      return;
    }
    
    const student = studentRes.rows[0];
    console.log('Student Info:', student);
    
    // Check results for this student
    const resultsRes = await client.query(`
      SELECT *
      FROM "Result"
      WHERE "userId" = $1;
    `, [student.id]);
    
    console.log(`Results count for ${student.name}:`, resultsRes.rows.length);
    resultsRes.rows.forEach(r => {
      console.log(`Sem: ${r.semester}, CourseId: ${r.courseId}, Code: ${r.subjectCode}, Name: ${r.subjectName}, Marks: ${r.marks}, Grade: ${r.grade}, Published: ${r.published}`);
    });
    
    // Check enrollments for this student
    const enrollmentsRes = await client.query(`
      SELECT e.*, c.title as course_title, c.semester as course_semester
      FROM "Enrollment" e
      JOIN "Course" c ON e."courseId" = c.id
      WHERE e."studentId" = $1;
    `, [student.id]);
    
    console.log('Enrollments count:', enrollmentsRes.rows.length);
    enrollmentsRes.rows.forEach(e => {
      console.log(`Course Title: ${e.course_title}, Sem: ${e.course_semester}, Status: ${e.status}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
