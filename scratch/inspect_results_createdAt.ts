import "dotenv/config";
import { db } from "../src/db";
import { results } from "../src/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  try {
    console.log("Fetching top 10 results from database ordered by createdAt...");
    const res = await db.select().from(results).orderBy(desc(results.createdAt)).limit(10);
    console.log("Top 10 Results:");
    res.forEach(r => {
      console.log(`- ID: ${r.id}, Student: ${r.studentRollNumber}, Course: ${r.subjectName}, Marks: ${r.marks}, Published: ${r.published}, CreatedAt: ${r.createdAt}`);
    });
  } catch (err) {
    console.error(err);
  }
}
main().then(() => process.exit(0));
