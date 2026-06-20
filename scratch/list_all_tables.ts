import "dotenv/config";
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));
    client.release();
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
