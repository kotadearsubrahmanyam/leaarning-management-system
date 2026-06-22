import nextEnv from "@next/env";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { results, blindEvaluations, users } from "../src/db/schema.ts";
import { eq, or } from "drizzle-orm";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    // Find the student by roll number
    const student = await db.select().from(users).where(eq(users.rollNumber, "25CSE001"));
    if (student.length === 0) {
        console.log("Student 25CSE001 not found by rollNumber, searching by email/name...");
        const all = await db.select().from(users).where(or(eq(users.email, "25cse001@test.com"), eq(users.name, "CSE Student")));
        console.log("Found:", all);
        if (all.length === 0) return;
        student.push(all[0]);
    }
    const s = student[0];
    console.log("Student:", s);

    const dbResults = await db.select().from(results).where(eq(results.userId, s.id));
    console.log("Results records:", dbResults);

    const dbEvals = await db.select().from(blindEvaluations).where(eq(blindEvaluations.studentId, s.id));
    console.log("Blind Evaluations records:", dbEvals);
}

main().catch(console.error).finally(() => pool.end());
