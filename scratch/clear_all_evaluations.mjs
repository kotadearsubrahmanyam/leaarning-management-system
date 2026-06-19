import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("DELETE FROM \"BlindEvaluation\"");
    console.log(`Successfully deleted all ${res.rowCount} evaluations. The dashboard is now clean!`);
  } catch (err) {
    console.error("Failed to clear evaluations:", err);
  } finally {
    client.release();
    await pool.end();
  }
}
main();
