import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const courses = {
  DBMS: "b579e180-29af-4628-bbda-6280b4028c30",
  TOC: "b801b5b4-25a3-41c6-ac2e-d21b7f1b243a",
  ASE: "4cc1401e-69f9-4770-95a5-15cb4b799ef0",
  OS: "acb791e2-9bd5-4cb9-a4f7-381d5d2715b4",
};

// Map file keyword to course
function getCourseId(filename) {
  const f = filename.toLowerCase();
  if (f.includes("dbms") || f.includes("cs301")) return courses.DBMS;
  if (f.includes("toc") || f.includes("cs302") || f.includes("chomsky") || f.includes("context_free") || f.includes("cfg") || f.includes("dfa") || f.includes("epsilon") || f.includes("pda") || f.includes("grammar") || f.includes("pumping_lemma") || f.includes("turing") || f.includes("halting") || f.includes("decidability") || f.includes("regular")) return courses.TOC;
  if (f.includes("ase") || f.includes("cs303") || f.includes("agile") || f.includes("scrum") || f.includes("sprint") || f.includes("tdd") || f.includes("user_stories") || f.includes("pair_programming") || f.includes("estimation")) return courses.ASE;
  if (f.includes("os") || f.includes("cs304") || f.includes("scheduling") || f.includes("process_states") || f.includes("system_calls") || f.includes("paging") || f.includes("deadlock") || f.includes("bankers") || f.includes("disk_") || f.includes("file_allocation") || f.includes("synchronization") || f.includes("page_replacement")) return courses.OS;
  
  // Default fallback based on some queries
  if (f.includes("acid") || f.includes("concurrency") || f.includes("relational") || f.includes("joins") || f.includes("nested") || f.includes("normalization") || f.includes("sql") || f.includes("procedures") || f.includes("er_diagram") || f.includes("functional")) return courses.DBMS;
  return null;
}

// Map file keyword to category
function getCategory(filename) {
  const f = filename.toLowerCase();
  if (f.includes("syllabus")) return "SYLLABUS";
  if (f.includes("viva") || f.includes("cheat_sheet") || f.includes("question_bank") || f.includes("marks")) return "IMPORTANT_QUESTIONS";
  if (f.includes("paper")) return "QUESTION_PAPERS";
  if (f.includes("textbook") || f.includes("silberschatz") || f.includes("pressman") || f.includes("manual") || f.includes("readings")) return "REFERENCE_MATERIALS";
  return "UNIT_NOTES"; // Default is unit notes
}

// Map file to display title
function getCleanTitle(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/\(1\)/g, "")
    .trim();
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("Seeding PDF materials into Database...");
    
    // Clear old seeded materials for these 4 courses to avoid duplication
    const courseIds = Object.values(courses);
    await client.query('DELETE FROM "Material" WHERE "courseId" = ANY($1);', [courseIds]);
    console.log("Cleared old materials.");

    const pdfsDir = "public/pdfscourses";
    if (!fs.existsSync(pdfsDir)) {
      console.error("Folder public/pdfscourses does not exist!");
      return;
    }

    const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith(".pdf"));
    console.log(`Found ${files.length} PDF files.`);

    let count = 0;
    for (const file of files) {
      const courseId = getCourseId(file);
      if (!courseId) {
        console.warn(`Could not resolve course for file: ${file}`);
        continue;
      }

      const category = getCategory(file);
      const title = getCleanTitle(file);
      const fileUrl = `/pdfscourses/${file}`;
      const size = "1.2 MB"; // default mock size
      
      await client.query(`
        INSERT INTO "Material" (id, "courseId", title, "fileUrl", "fileType", size, category, "uploadedBy", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [
        crypto.randomUUID(),
        courseId,
        title,
        fileUrl,
        "application/pdf",
        size,
        category,
        "FACULTY"
      ]);
      
      count++;
    }

    console.log(`Successfully seeded ${count} materials!`);
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
