import "dotenv/config";
import { db } from "./index";
import { users, feeStructure, results, attendance, studentActivities, courses } from "./schema";
import { eq, inArray, sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";

async function main() {
  console.log("Starting Demo Data Randomization...");

  // 1. Fetch all students
  const allStudents = await db.select().from(users).where(eq(users.role, "STUDENT"));
  console.log(`Found ${allStudents.length} students. Randomizing...`);

  if (allStudents.length === 0) {
    console.log("No students found. Exiting.");
    return;
  }

  const studentIds = allStudents.map(s => s.id);

  // 2. Randomize User Attributes (Quotas, Reimbursements, Dues)
  for (const student of allStudents) {
    const r = Math.random();
    let quota = "CONVENER";
    let isReimbursed = false;

    if (r < 0.4) {
      quota = "CONVENER";
      isReimbursed = Math.random() < 0.8; // 80% of convener get govt fee reimbursement
    } else if (r < 0.8) {
      quota = "MANAGEMENT";
      isReimbursed = Math.random() < 0.2; // 20% of management get some scholarship
    } else if (r < 0.9) {
      quota = "NRI";
    } else {
      quota = "SPOT";
    }

    // Randomize dues clearances for 8th sem students (let's apply to all for testing)
    const libraryCleared = Math.random() < 0.8;
    const hostelCleared = Math.random() < 0.8;
    const accountsCleared = Math.random() < 0.8;

    await db.update(users)
      .set({
        admissionQuota: quota as any,
        isFeeReimbursed: isReimbursed,
        libraryCleared,
        hostelCleared,
        accountsCleared
      })
      .where(eq(users.id, student.id));
  }
  console.log("✅ Randomized User Quotas & Dues Clearances.");

  // 3. Randomize Fee Exemptions and Discounts
  const allFees = await db.select().from(feeStructure);
  for (const fee of allFees) {
    // If student is reimbursed, apply massive discount to tuition
    const student = allStudents.find(s => s.id === fee.userId);
    if (student && fee.feeType === "TUITION") {
       if (student.isFeeReimbursed) {
         const discount = Math.floor(fee.amount * (Math.random() * 0.5 + 0.5)); // 50-100% discount
         await db.update(feeStructure).set({ discountAmount: discount }).where(eq(feeStructure.id, fee.id));
       }
    }
    // Random late fee exemption
    if (Math.random() < 0.05) {
      await db.update(feeStructure).set({ isLateFeeExempt: true }).where(eq(feeStructure.id, fee.id));
    }
  }
  console.log("✅ Randomized Fee Discounts & Exemptions.");

  // 4. Create Borderline Fails for Grace Marks Testing
  const allResults = await db.select().from(results).where(eq(results.published, false));
  let modifiedResults = 0;
  for (const res of allResults) {
    if (Math.random() < 0.1) { // Make 10% of unpublished results borderline fails
      await db.update(results)
        .set({
           internalMarks: 15,
           externalMarks: 24, // Borderline! Needs 26.
           marks: 39,
           grade: 'F',
           status: 'FAIL'
        })
        .where(eq(results.id, res.id));
      modifiedResults++;
    }
  }
  console.log(`✅ Set ${modifiedResults} unpublished results to 24 external marks (Grace Marks bait).`);

  // 5. Generate Fake Activities (Pending Status)
  const targetStudents = allStudents.slice(0, 10);
  for (const student of targetStudents) {
    await db.insert(studentActivities).values({
      userId: student.id,
      activityType: "HACKATHON",
      title: "Smart India Hackathon Finalist",
      description: "Built an AI tool.",
      proofUrl: "https://example.com/fake-certificate.pdf",
      verificationStatus: "PENDING"
    });
  }
  console.log("✅ Generated PENDING student activities.");

  console.log("🎉 Demo Data Randomization Complete!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
