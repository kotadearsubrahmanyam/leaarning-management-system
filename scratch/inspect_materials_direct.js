const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("--- QUERYING ALL COURSES ---");
        const coursesRes = await pool.query('SELECT * FROM "Course"');
        const coursesMap = {};
        coursesRes.rows.forEach(c => {
            coursesMap[c.id] = c;
            console.log(`Course ID: ${c.id}, Code: ${c.subjectCode}, Title: "${c.title}", Semester: ${c.semester}`);
        });

        console.log("\n--- QUERYING ALL MATERIALS ---");
        const materialsRes = await pool.query('SELECT * FROM "Material"');
        materialsRes.rows.forEach(m => {
            const c = coursesMap[m.courseId] || { title: "Unknown Course" };
            console.log(`Material ID: ${m.id}\n  Course: "${c.title}" (${m.courseId})\n  Category: ${m.category}\n  Title: "${m.title}"\n  URL: "${m.fileUrl}"\n  Size: ${m.size}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
