const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Altering QuizQuestion table...");
    await pool.query(`
      ALTER TABLE "QuizQuestion" ADD COLUMN IF NOT EXISTS "explanation" text;
    `);
    console.log("QuizQuestion table altered successfully.");

    console.log("Altering QuizSubmission table...");
    await pool.query(`
      ALTER TABLE "QuizSubmission" ADD COLUMN IF NOT EXISTS "timeTaken" integer;
    `);
    console.log("QuizSubmission table altered successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
