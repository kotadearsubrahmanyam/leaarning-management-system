const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    console.log("Creating ImportHistory table if it doesn't exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ImportHistory" (
        "id" text PRIMARY KEY,
        "uploadDate" timestamp (3) DEFAULT now() NOT NULL,
        "uploadedBy" text NOT NULL,
        "createdCount" integer NOT NULL,
        "failedCount" integer NOT NULL,
        "status" text DEFAULT 'COMPLETED' NOT NULL,
        "roleType" text NOT NULL
      );
    `);
    console.log("ImportHistory table verified/created successfully.");
    client.release();
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

run();
