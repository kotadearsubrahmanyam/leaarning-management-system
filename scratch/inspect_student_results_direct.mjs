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
    
    // Find student 25cse001@test.com
    const studentRes = await client.query(`
      SELECT id, name, email, "rollNumber", semester, "departmentId"
      FROM "User"
      WHERE email = '25cse001@test.com';
    `);
    
    if (studentRes.rows.length === 0) {
      console.log('Student 25cse001 not found.');
      return;
    }
    
    const student = studentRes.rows[0];
    console.log('Student Info:', student);
    
    // Get all results for this student
    const resultsRes = await client.query(`
      SELECT r.id, r.semester, r."courseId", c.title as course_title, r.marks, r.grade, r.published
      FROM "Result" r
      LEFT JOIN "Course" c ON r."courseId" = c.id
      WHERE r."userId" = $1
      ORDER BY r.semester, c.title;
    `, [student.id]);
    
    console.log(`Total results in DB for ${student.name}:`, resultsRes.rows.length);
    resultsRes.rows.forEach(r => {
      console.log(`Sem: ${r.semester}, CourseId: ${r.courseId}, Title: ${r.course_title}, Marks: ${r.marks}, Grade: ${r.grade}, Published: ${r.published}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
