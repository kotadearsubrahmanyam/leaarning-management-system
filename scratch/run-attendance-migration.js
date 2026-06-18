const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  console.log("DB URL:", process.env.DATABASE_URL ? "Exists" : "MISSING");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  try {
    console.log("Starting database DDL migration for Session-Based Attendance...");

    // 1. Drop old Attendance table
    console.log("Dropping old 'Attendance' table...");
    await client.query(`DROP TABLE IF EXISTS "Attendance" CASCADE;`);

    // 2. Create ClassSession table
    console.log("Creating 'ClassSession' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ClassSession" (
        "id" text PRIMARY KEY,
        "courseId" text NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
        "facultyId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "sectionId" text NOT NULL,
        "date" timestamp (3) with time zone NOT NULL,
        "startTime" text NOT NULL,
        "endTime" text NOT NULL,
        "sessionType" text NOT NULL,
        "createdAt" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 3. Create new Attendance table
    console.log("Creating new 'Attendance' table with composite unique constraint...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Attendance" (
        "id" text PRIMARY KEY,
        "studentId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "sessionId" text NOT NULL REFERENCES "ClassSession"("id") ON DELETE CASCADE,
        "status" text NOT NULL,
        "timestamp" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedBy" text REFERENCES "User"("id") ON DELETE SET NULL,
        "updatedAt" timestamp (3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT "student_session_unique" UNIQUE ("studentId", "sessionId")
      );
    `);

    console.log("Database DDL migration finished successfully!");
  } catch (error) {
    console.error("DDL migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
