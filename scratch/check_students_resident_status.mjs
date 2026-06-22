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
    
    const res = await client.query(`
      SELECT id, name, email, "residentStatus", "isFeeReimbursed"
      FROM "User"
      WHERE email IN ('25cse001@test.com', '24cse001@test.com', '26cse001@test.com');
    `);
    
    console.log(res.rows);
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
