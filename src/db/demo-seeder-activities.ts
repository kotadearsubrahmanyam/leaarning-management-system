import "dotenv/config";
import { db } from "./index";
import { users, studentActivities } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting Quick Fix Seeder...");
  const allStudents = await db.select().from(users).where(eq(users.role, "STUDENT"));
  
  if (allStudents.length === 0) return;

  const targetStudents = allStudents.slice(0, 10);
  for (const student of targetStudents) {
    try {
      await db.insert(studentActivities).values({
        studentId: student.id,
        type: "HACKATHON",
        title: "Smart India Hackathon Finalist",
        description: "Built an AI tool.",
        proofUrl: "https://example.com/fake-certificate.pdf",
        verificationStatus: "PENDING"
      });
    } catch(e: any) {
      console.log(e.message);
    }
  }
  console.log("✅ Generated PENDING student activities.");
  process.exit(0);
}

main().catch((e: any) => {
  console.error(e);
  process.exit(1);
});
