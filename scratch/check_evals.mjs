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
    const result = await client.query(`
      SELECT id, name, email, role, "rollNumber"
      FROM "User"
      WHERE id = '5cafbb75-a246-47a9-826d-7ff4a102ead2';
    `);
    console.log('User details:');
    console.log(JSON.stringify(result.rows, null, 2));
    client.release();
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await pool.end();
  }
}

main();
