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
    
    const coursesRes = await client.query('SELECT id, title, semester FROM "Course" WHERE title ILIKE \'%Database%\' OR title ILIKE \'%Theory of Computation%\' OR title ILIKE \'%Agile%\' OR title ILIKE \'%Operating System%\';');
    console.log(JSON.stringify(coursesRes.rows, null, 2));
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
