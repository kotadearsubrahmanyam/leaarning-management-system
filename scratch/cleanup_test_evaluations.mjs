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
    const res = await client.query("DELETE FROM \"BlindEvaluation\" WHERE \"pdfUrl\" LIKE '%test_exam_paper%'");
    console.log(`Cleaned up ${res.rowCount} test evaluations.`);
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
