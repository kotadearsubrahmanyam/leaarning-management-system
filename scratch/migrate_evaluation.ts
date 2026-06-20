import "dotenv/config";
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Checking / Creating EvaluationStatus Enum...");
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "EvaluationStatus" AS ENUM('PENDING', 'EVALUATED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Checking / Creating BlindEvaluation Table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BlindEvaluation" (
        "id" text PRIMARY KEY NOT NULL,
        "studentId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "courseId" text NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
        "facultyId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "pdfUrl" text NOT NULL,
        "marks" integer,
        "status" "EvaluationStatus" DEFAULT 'PENDING' NOT NULL,
        "createdAt" timestamp(3) DEFAULT now() NOT NULL,
        "updatedAt" timestamp(3) DEFAULT now() NOT NULL
      );
    `);
    console.log("BlindEvaluation table created successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
