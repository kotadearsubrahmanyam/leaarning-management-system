const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- CLEANING UP UNGRADED RESULTS FROM LEDGER ---");

  // Find all student-course pairs where a blind evaluation is PENDING
  const pendingEvalsRes = await pool.query(`
    SELECT "studentId", "courseId" FROM "BlindEvaluation" WHERE status = 'PENDING'
  `);
  const pendingEvals = pendingEvalsRes.rows;
  console.log(`Found ${pendingEvals.length} pending evaluations in DB.`);

  let deletedCount = 0;
  for (const row of pendingEvals) {
    // Delete result if it exists (since paper is not graded yet, ledger should not have draft scores)
    const deleteRes = await pool.query(`
      DELETE FROM "Result" WHERE "userId" = $1 AND "courseId" = $2
    `, [row.studentId, row.courseId]);
    deletedCount += deleteRes.rowCount;
  }
  console.log(`Removed ${deletedCount} pre-populated mock results for pending evaluations.`);

  // Also set existing evaluated result records to published = false (draft) 
  // because the user specified that publication requires admin approval
  const syncDraftsRes = await pool.query(`
    UPDATE "Result" r
    SET published = false
    FROM "BlindEvaluation" e
    WHERE r."userId" = e."studentId" 
      AND r."courseId" = e."courseId" 
      AND e.status = 'EVALUATED'
  `);
  console.log(`Updated ${syncDraftsRes.rowCount} results to DRAFT (waiting for Admin approval/declaration).`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
