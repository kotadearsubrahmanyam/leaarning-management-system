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
    
    // Fetch all student users
    const studentsRes = await client.query(`
      SELECT id, name, email, "rollNumber", semester, "departmentId"
      FROM "User"
      WHERE role = 'STUDENT'
      ORDER BY "rollNumber" ASC;
    `);
    
    console.log('Students count:', studentsRes.rows.length);
    studentsRes.rows.forEach(s => {
      console.log(`ID: ${s.id}, Name: ${s.name}, Email: ${s.email}, Roll: ${s.rollNumber}, Sem: ${s.semester}, Dept: ${s.departmentId}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
