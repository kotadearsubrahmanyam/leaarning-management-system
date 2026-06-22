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
    console.log('Adding columns mid1, mid2, and assignmentMarks to Result table...');
    await client.query(`
      ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "mid1" integer DEFAULT 0 NOT NULL;
    `);
    await client.query(`
      ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "mid2" integer DEFAULT 0 NOT NULL;
    `);
    await client.query(`
      ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "assignmentMarks" integer DEFAULT 0 NOT NULL;
    `);
    console.log('Columns added successfully.');
    client.release();
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await pool.end();
  }
}

main();
