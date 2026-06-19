import { jsPDF } from "jspdf";
import fs from "fs";

try {
  const doc = new jsPDF();
  doc.text("Page 1: Student Identity Info", 10, 10);
  doc.addPage();
  doc.text("Page 2: Exam Answers and Content", 10, 10);
  
  const buffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync("scratch/test_jspdf.pdf", buffer);
  console.log("Success generating PDF with jsPDF!");
} catch (err) {
  console.error("Failed to generate PDF:", err);
}
