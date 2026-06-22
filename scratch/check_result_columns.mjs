import pg from 'pg';
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const client = await pool.connect();
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Result';
    `);
    console.log('Columns of Result table:');
    columns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    client.release();
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await pool.end();
  }
}

main();
