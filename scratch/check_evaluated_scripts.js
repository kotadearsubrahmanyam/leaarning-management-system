const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("--- SEARCHING FOR ALL EVALUATED PAPERS ---");
  const res = await pool.query(`
    SELECT e.id as eval_id, e."studentId", e."courseId", e.marks, e.status, 
           u.name as student_name, u."rollNumber" as student_roll, 
           c.title as course_title, c.semester as course_sem
    FROM "BlindEvaluation" e
    JOIN "User" u ON e."studentId" = u.id
    JOIN "Course" c ON e."courseId" = c.id
    WHERE e.status = 'EVALUATED'
  `);
  
  console.log(`Found ${res.rows.length} evaluated scripts in BlindEvaluation:`);
  for (const r of res.rows) {
    console.log(`\n- Eval ID: ${r.eval_id}`);
    console.log(`  Student: ${r.student_name} (${r.student_roll}, ID: ${r.studentId})`);
    console.log(`  Course: ${r.course_title} (ID: ${r.courseId}, Sem: ${r.course_sem})`);
    console.log(`  Marks: ${r.marks}`);
    
    // Check if result exists
    const resExist = await pool.query(
      'SELECT id, marks, grade, status, published FROM "Result" WHERE "userId" = $1 AND "courseId" = $2',
      [r.studentId, r.courseId]
    );
    if (resExist.rows.length > 0) {
      console.log(`  -> Match in Result table: ID=${resExist.rows[0].id}, Marks=${resExist.rows[0].marks}, Grade=${resExist.rows[0].grade}, Published=${resExist.rows[0].published}`);
    } else {
      console.log(`  -> WARNING: No match found in Result table!`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
