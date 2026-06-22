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
    
    // Fetch all courses for department a45b116c-fc0e-4f1b-931b-d1e0a19fd852 and sem 1
    const coursesRes = await client.query(`
      SELECT id, title, semester, "categoryId", "teacherId"
      FROM "Course"
      WHERE "categoryId" = 'a45b116c-fc0e-4f1b-931b-d1e0a19fd852';
    `);
    
    console.log('Courses count for department:', coursesRes.rows.length);
    coursesRes.rows.forEach(c => {
      console.log(`ID: ${c.id}, Title: ${c.title}, Sem: ${c.semester}, Category: ${c.categoryId}, Teacher: ${c.teacherId}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
