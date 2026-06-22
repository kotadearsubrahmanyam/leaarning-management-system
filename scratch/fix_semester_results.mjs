import nextEnv from "@next/env";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { results, blindEvaluations } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    console.log("Starting data migration to fix externalMarks...");
    const dbResults = await db.select().from(results);
    console.log(`Found ${dbResults.length} result records.`);

    let updatedCount = 0;
    for (const r of dbResults) {
        // If externalMarks is greater than 50, it means it's still out of 100 and needs to be halved.
        if (r.externalMarks > 50) {
            console.log(`Fixing result ID=${r.id} for courseId=${r.courseId}, studentId=${r.userId}`);
            console.log(`  Old values: classInternal=${r.classInternal}, classExternal=${r.classExternal}, internalMarks=${r.internalMarks}, externalMarks=${r.externalMarks}, marks=${r.marks}, grade=${r.grade}`);
            
            const scaledExternal = Math.round(r.externalMarks / 2);
            const total = r.internalMarks + scaledExternal;
            
            const grade = total >= 90 ? "O" : total >= 80 ? "A+" : total >= 70 ? "A" : total >= 60 ? "B+" : total >= 50 ? "B" : total >= 45 ? "C" : total >= 40 ? "D" : "F";
            const status = total >= 40 ? "PASS" : "FAIL";

            await db.update(results).set({
                externalMarks: scaledExternal,
                marks: total,
                grade,
                status
            }).where(eq(results.id, r.id));
            
            console.log(`  New values: externalMarks=${scaledExternal}, marks=${total}, grade=${grade}, status=${status}`);
            updatedCount++;
        }
    }
    console.log(`Successfully updated ${updatedCount} results records.`);
}

main().catch(console.error).finally(() => pool.end());
