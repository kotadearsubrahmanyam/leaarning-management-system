const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Altering Quiz table to add studentId...");
    await pool.query(`
      ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "studentId" text REFERENCES "User"("id") ON DELETE CASCADE;
    `);
    console.log("Quiz table altered successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
