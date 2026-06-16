const { Pool } = require('pg');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "MentoringPlan" (
        "id" text PRIMARY KEY,
        "studentId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "teacherId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "planContent" text NOT NULL,
        "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "Quiz" (
        "id" text PRIMARY KEY,
        "courseId" text NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
        "teacherId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "title" text NOT NULL,
        "timeLimit" integer DEFAULT 15 NOT NULL,
        "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "QuizQuestion" (
        "id" text PRIMARY KEY,
        "quizId" text NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
        "question" text NOT NULL,
        "options" text NOT NULL,
        "correctAnswer" text NOT NULL,
        "points" integer DEFAULT 1 NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "QuizSubmission" (
        "id" text PRIMARY KEY,
        "quizId" text NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
        "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "score" integer NOT NULL,
        "totalPoints" integer NOT NULL,
        "answers" text,
        "isMalpractice" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

migrate();
