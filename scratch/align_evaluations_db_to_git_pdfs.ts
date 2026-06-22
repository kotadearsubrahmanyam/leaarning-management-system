import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { db } from "../src/db";
import { blindEvaluations } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Fetching original Git evaluations PDF list from commit 23e082d...");
    const gitOutput = execSync("git ls-tree -r 23e082d --name-only public/uploads/evaluations/")
      .toString()
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    const originalFileNames = gitOutput.map(p => path.basename(p));
    console.log(`Found ${originalFileNames.length} original PDFs in git history.`);

    console.log("Fetching all evaluations from database...");
    const evals = await db.query.blindEvaluations.findMany({
      with: {
        student: true,
        course: true,
      }
    });
    console.log(`Found ${evals.length} evaluations in database.`);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "evaluations");
    let matchedCount = 0;

    for (const ev of evals) {
      const studentRoll = ev.student?.rollNumber;
      const courseTitle = ev.course?.title;
      if (!studentRoll || !courseTitle) {
        console.warn(`Evaluation ID ${ev.id} is missing student roll or course title.`);
        continue;
      }

      // Clean course title to match folder/filename naming conventions
      const cleanedTitle = courseTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const expectedSuffix = `${studentRoll}_${cleanedTitle}.pdf`.toLowerCase();

      // Find the file from original git file names ending with our suffix
      const matchedFileName = originalFileNames.find(name => name.toLowerCase().endsWith(expectedSuffix));

      if (matchedFileName) {
        const newPdfUrl = `/uploads/evaluations/${matchedFileName}`;
        
        console.log(`Matching Roll: ${studentRoll} -> Updating pdfUrl to: ${newPdfUrl}`);
        
        await db.update(blindEvaluations)
          .set({ pdfUrl: newPdfUrl })
          .where(eq(blindEvaluations.id, ev.id));

        matchedCount++;
      } else {
        console.warn(`No original PDF found in git for student ${studentRoll} and course "${courseTitle}".`);
      }
    }

    console.log(`\n🎉 Database Alignment Complete! Matches found and updated: ${matchedCount}/${evals.length}`);

    // Now, clean up the newly generated files from public/uploads/evaluations
    console.log("\nCleaning up newly generated/untracked PDFs from public/uploads/evaluations...");
    const currentFiles = fs.readdirSync(uploadDir);
    let deletedCount = 0;

    currentFiles.forEach(file => {
      // If it's a PDF and NOT in our original git file list, delete it
      if (file.endsWith(".pdf") && !originalFileNames.includes(file)) {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    console.log(`Deleted ${deletedCount} newly generated/untracked PDF files.`);

  } catch (error) {
    console.error("Failed to align evaluations DB to Git PDFs:", error);
  }
}

main().then(() => process.exit(0));
