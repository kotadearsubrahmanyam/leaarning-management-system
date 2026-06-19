import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query("SELECT * FROM \"BlindEvaluation\" LIMIT 1");
    const ev = res.rows[0];
    if (!ev) {
      console.log("No evaluations found.");
      return;
    }
    console.log("Found evaluation pdfUrl:", ev.pdfUrl);

    console.log("Fetching from server...");
    const url = `http://localhost:3000${ev.pdfUrl}`;
    const response = await fetch(url, {
      method: "GET"
    });
    console.log("Status:", response.status);
    console.log("Headers:");
    response.headers.forEach((val, key) => console.log(`  ${key}: ${val}`));
    const text = await response.text();
    console.log("Snippet of body (first 200 chars):", text.substring(0, 200));

  } catch (err) {
    console.error(err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}
main();
