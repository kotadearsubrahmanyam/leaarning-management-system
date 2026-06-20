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
    
    // Fetch semester 3 students
    const res = await client.query(`
      SELECT id, name, email, "rollNumber", "departmentId", semester 
      FROM "User" 
      WHERE role = 'STUDENT' AND semester = 3
      ORDER BY "rollNumber" ASC
      LIMIT 10;
    `);
    
    console.log('Semester 3 Students in Database:');
    console.log(JSON.stringify(res.rows, null, 2));
    
    client.release();
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await pool.end();
  }
}

main();
