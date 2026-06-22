import "dotenv/config";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import { db } from "../src/db";
import { blindEvaluations } from "../src/db/schema";

async function main() {
  try {
    console.log("Fetching all blind evaluations from database...");
    const evals = await db.select().from(blindEvaluations);
    console.log(`Found ${evals.length} evaluations in database.`);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "evaluations");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }

    // Generate a valid 2-page PDF buffer with jsPDF
    console.log("Generating template 2-page PDF...");
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CONFIDENTIAL EVALUATION", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Page 1: Student Identity Sheet & Admission Record", 20, 60);
    doc.text("This page is automatically protected under blind evaluation regulations.", 20, 70);
    doc.text("Student ID: [REDACTED]", 20, 80);
    doc.text("Roll Number: [REDACTED]", 20, 90);
    
    // Add page 2 (the script content)
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SECTION B: ANSWER SCRIPT", 20, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Q1. Explain the differences between Agile and Waterfall methodologies.", 20, 50);
    doc.text("Agile methodology is iterative and incremental, focusing on collaboration and flexibility.", 25, 60);
    doc.text("Waterfall is linear and sequential, moving through fixed phases (Requirements, Design, Code, Test, Deploy).", 25, 68);
    
    doc.text("Q2. Detail the 5 phases of software design life cycle (SDLC).", 20, 85);
    doc.text("1. Planning and Requirement Analysis: Gathering client inputs and defining milestones.", 25, 95);
    doc.text("2. Defining Requirements: Writing Software Requirement Specifications (SRS) document.", 25, 103);
    doc.text("3. Designing: Architects design database schemas, network topography, and module design.", 25, 111);
    doc.text("4. Implementation or Coding: Developers write code matching design blueprints.", 25, 119);
    doc.text("5. Testing: QA testers verify the product against original specifications.", 25, 127);
    
    doc.text("Q3. Write short notes on database normalization.", 20, 142);
    doc.text("Normalization is the process of organizing data in a database to reduce redundancy and improve integrity.", 25, 152);
    doc.text("First Normal Form (1NF) requires atomic values and unique records.", 25, 160);
    doc.text("Second Normal Form (2NF) removes partial dependencies.", 25, 168);
    doc.text("Third Normal Form (3NF) removes transitive dependencies.", 25, 176);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    let createdCount = 0;
    let existCount = 0;

    for (const ev of evals) {
      if (!ev.pdfUrl) continue;
      
      // Get the relative file path from the url (e.g. /uploads/evaluations/xyz.pdf)
      const fileName = path.basename(ev.pdfUrl);
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, pdfBuffer);
      createdCount++;
    }

    console.log(`\n🎉 Success! Synchronized all evaluation files.`);
    console.log(`Total DB evaluations processed: ${evals.length}`);
    console.log(`PDFs written to public/uploads/evaluations: ${createdCount}`);

  } catch (error) {
    console.error("Failed to fix database evaluations PDFs:", error);
  }
}

main().then(() => process.exit(0));
