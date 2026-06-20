const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("--- SEMESTER 3 COURSES ---");
        const coursesRes = await pool.query('SELECT * FROM "Course" WHERE semester = 3');
        const courseIds = [];
        coursesRes.rows.forEach(c => {
            courseIds.push(c.id);
            console.log(`Course ID: ${c.id}, Code: ${c.subjectCode}, Title: "${c.title}"`);
        });

        if (courseIds.length === 0) {
            console.log("No Semester 3 courses found!");
            return;
        }

        console.log("\n--- MATERIALS FOR SEMESTER 3 COURSES ---");
        const materialsRes = await pool.query(
            'SELECT * FROM "Material" WHERE "courseId" = ANY($1)',
            [courseIds]
        );
        materialsRes.rows.forEach(m => {
            console.log(`Material ID: ${m.id}\n  Course ID: ${m.courseId}\n  Category: ${m.category}\n  Title: "${m.title}"\n  URL: "${m.fileUrl}"\n  Size: ${m.size}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
