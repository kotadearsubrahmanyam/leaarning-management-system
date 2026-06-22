const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- CLEANING UP RESULT TABLE METADATA ---");
  
  // 1. Sync semesters, credits, subjectName from Course table
  const syncCoursesRes = await pool.query(`
    UPDATE "Result" r
    SET semester = c.semester,
        credits = c.credits,
        "subjectName" = COALESCE(r."subjectName", c.title),
        "subjectCode" = COALESCE(r."subjectCode", UPPER(SUBSTRING(c.id FROM 1 FOR 6)))
    FROM "Course" c
    WHERE r."courseId" = c.id 
      AND (r.semester != c.semester OR r.credits != c.credits OR r."subjectName" IS NULL OR r."subjectCode" IS NULL)
  `);
  console.log(`Updated semester/credits/subject details for ${syncCoursesRes.rowCount} result rows.`);

  // 2. Sync studentName, studentRollNumber from User table
  const syncUsersRes = await pool.query(`
    UPDATE "Result" r
    SET "studentName" = COALESCE(r."studentName", u.name),
        "studentRollNumber" = COALESCE(r."studentRollNumber", u."rollNumber")
    FROM "User" u
    WHERE r."userId" = u.id
      AND (r."studentName" IS NULL OR r."studentRollNumber" IS NULL)
  `);
  console.log(`Updated student name/roll number details for ${syncUsersRes.rowCount} result rows.`);

  // 3. Print verification info for student 25CSE002
  console.log("\nVerification for Student 25CSE002:");
  const res = await pool.query('SELECT * FROM "Result" WHERE "userId" = \'bf007c6f-df9d-4914-9655-f5ba59930e9a\'');
  res.rows.forEach(r => {
    console.log(`- Course ID: ${r.courseId}, Code: ${r.subjectCode}, Name: ${r.subjectName}, Sem: ${r.semester}, Marks: ${r.marks}, Grade: ${r.grade}, Status: ${r.status}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
