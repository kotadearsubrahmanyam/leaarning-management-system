import nextEnv from "@next/env";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, enrollments, courses } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    const student = await db.select().from(users).where(eq(users.email, "24cse001@test.com"));
    if (student.length === 0) {
        console.log("Student not found!");
        return;
    }
    const s = student[0];
    console.log(`Student: ID=${s.id}, Email=${s.email}, Sem=${s.semester}`);
    const dbEnrollments = await db.select().from(enrollments).where(eq(enrollments.studentId, s.id));
    console.log(`Enrollments: ${dbEnrollments.length}`);
    for (const e of dbEnrollments) {
        const c = await db.select().from(courses).where(eq(courses.id, e.courseId));
        console.log(`- Course: ${c[0]?.title}, Semester: ${c[0]?.semester}, Status: ${e.status}`);
    }
}
main().catch(console.error).finally(() => pool.end());
