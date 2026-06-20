import { db } from "../src/db/index.ts";
import { courses } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
    const dbms = await db.select().from(courses).where(eq(courses.title, "Database Management Systems")).limit(1);
    if (dbms.length > 0) {
        console.log(`DBMS_COURSE_ID: ${dbms[0].id}`);
    } else {
        console.log("DBMS Course not found");
    }
}

main().catch(console.error);
