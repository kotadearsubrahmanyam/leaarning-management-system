import "dotenv/config";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";

async function main() {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "evaluations");
  if (!fs.existsSync(uploadDir)) {
    console.error("Uploads directory does not exist.");
    return;
  }

  const files = fs.readdirSync(uploadDir);
  console.log(`Found ${files.length} files in public/uploads/evaluations.`);

  let count = 0;
  
  // Create a 2-page PDF using jsPDF
  const doc = new jsPDF();
  doc.text("Page 1: Student Identity Info", 10, 10);
  doc.addPage();
  doc.text("Page 2: Exam Answers and Content", 10, 10);
  const buffer = Buffer.from(doc.output("arraybuffer"));

  files.forEach(file => {
    if (file.endsWith(".pdf")) {
      const filePath = path.join(uploadDir, file);
      fs.writeFileSync(filePath, buffer);
      count++;
    }
  });

  console.log(`Successfully fixed ${count} existing PDF uploads to be valid jsPDF 2-page PDFs.`);
}

main();
