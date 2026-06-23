import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:/Users/kdear/OneDrive/Desktop/final 2nd/.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM "LearningPath";');
    console.log(JSON.stringify(result.rows, null, 2));
    client.release();
  } catch (error) {
    console.error('Error connecting to DB or querying:', error);
  } finally {
    await pool.end();
  }
}

main();
