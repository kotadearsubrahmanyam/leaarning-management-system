import { db } from "../src/db/index.ts";
import { courses, materials } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
    console.log("--- ALL COURSES AND THEIR MATERIALS ---");
    const dbCourses = await db.select().from(courses);
    for (const c of dbCourses) {
        const dbMaterials = await db.select().from(materials).where(eq(materials.courseId, c.id));
        if (dbMaterials.length > 0) {
            console.log(`Course: [${c.semester}] ${c.title}`);
            dbMaterials.forEach(m => {
                console.log(`  - Category: ${m.category}, Title: "${m.title}", URL: "${m.fileUrl}", Size: ${m.size}`);
            });
        }
    }
}

main().catch(console.error);
