import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { db } from "../src/db/index";
import { courses, materials } from "../src/db/schema";
import { and, eq, sql } from "drizzle-orm";
import * as crypto from "crypto";

// Helper to format file size
const getFormattedFileSize = (filePath: string): string => {
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
};

// Map local folders and filenames to DB courses
const getCourseMatch = (folderName: string, fileName: string, dbCourses: any[]) => {
    const fileLower = fileName.toLowerCase();
    const folderLower = folderName.toLowerCase().trim();

    // 1. Check subject codes/names in the filename first (handles misplaced files and impques)
    if (fileLower.includes("cs301") || fileLower.includes("dbms") || fileLower.includes("database")) {
        return dbCourses.find(c => c.title.toLowerCase().includes("database") || c.subjectCode?.includes("CS301"));
    }
    if (fileLower.includes("cs302") || fileLower.includes("toc") || fileLower.includes("computation") || fileLower.includes("theory of")) {
        return dbCourses.find(c => c.title.toLowerCase().includes("computation") || c.title.toLowerCase().includes("theory of") || c.subjectCode?.includes("CS302"));
    }
    if (fileLower.includes("cs303") || fileLower.includes("ase") || fileLower.includes("agile")) {
        return dbCourses.find(c => c.title.toLowerCase().includes("agile") || c.subjectCode?.includes("CS303"));
    }
    if (fileLower.includes("cs304") || fileLower.includes("os_") || fileLower.startsWith("os ") || fileLower.includes("operating")) {
        return dbCourses.find(c => c.title.toLowerCase().includes("operating") || c.subjectCode?.includes("CS304"));
    }

    // 2. Fallback to folder name
    if (folderLower === "dbms") {
        return dbCourses.find(c => c.title.toLowerCase().includes("database") || c.subjectCode?.includes("CS301"));
    }
    if (folderLower === "toc") {
        return dbCourses.find(c => c.title.toLowerCase().includes("computation") || c.title.toLowerCase().includes("theory of") || c.subjectCode?.includes("CS302"));
    }
    if (folderLower === "agile") {
        return dbCourses.find(c => c.title.toLowerCase().includes("agile") || c.subjectCode?.includes("CS303"));
    }
    if (folderLower === "os") {
        return dbCourses.find(c => c.title.toLowerCase().includes("operating") || c.subjectCode?.includes("CS304"));
    }

    return null;
};

// Map filenames to target categories, subcategories, units, and titles
const mapFileMetadata = (folderName: string, fileName: string) => {
    const cleanName = fileName.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    const lowerName = cleanName.toLowerCase();
    
    let category = "REFERENCE_MATERIALS";
    let subcategory = "";
    let unitNumber = "";
    // Clean prefix tags like "DBMS_", "ASE_", "TOC_", "OS_"
    let dbTitle = cleanName.replace(/^(dbms|ase|toc|os)\s*[-_]?\s*/i, "");

    // 1. Handle Syllabus
    if (lowerName.includes("syllabus")) {
        category = "SYLLABUS";
        if (lowerName.includes("breakdown")) {
            dbTitle = "Unit-wise Syllabus Breakdown.pdf";
        } else {
            if (lowerName.includes("cs303") || lowerName.includes("agile")) {
                dbTitle = "Complete Syllabus (CS303).pdf";
            } else if (lowerName.includes("cs304") || lowerName.includes("os")) {
                dbTitle = "Complete Syllabus (CS304).pdf";
            } else if (lowerName.includes("cs302") || lowerName.includes("toc")) {
                dbTitle = "Complete Syllabus (CS302).pdf";
            } else if (lowerName.includes("cs301") || lowerName.includes("dbms")) {
                dbTitle = "Complete Syllabus (CS301).pdf";
            } else if (folderName === "agile") {
                dbTitle = "Complete Syllabus (CS303).pdf";
            } else if (folderName === "os") {
                dbTitle = "Complete Syllabus (CS304).pdf";
            } else if (folderName === "toc") {
                dbTitle = "Complete Syllabus (CS302).pdf";
            } else if (folderName === "dbms") {
                dbTitle = "Complete Syllabus (CS301).pdf";
            } else {
                dbTitle = "Complete Syllabus.pdf";
            }
        }
    }
    // 2. Handle Important Questions (from impques or containing question bank / viva)
    else if (lowerName.includes("question bank") || lowerName.includes("viva") || lowerName.includes("prep") || folderName === "impques") {
        category = "IMPORTANT_QUESTIONS";
        if (lowerName.includes("5 mark") || lowerName.includes("5mark")) {
            subcategory = "5 Marks Questions";
        } else if (lowerName.includes("10 mark") || lowerName.includes("10mark")) {
            subcategory = "10 Marks Questions";
        } else if (lowerName.includes("viva") || lowerName.includes("prep")) {
            subcategory = "Viva Questions";
        } else {
            subcategory = "General Question Banks";
        }
    }
    // 3. Handle Unit Notes
    else {
        category = "UNIT_NOTES";
        const isAgile = lowerName.includes("cs303") || lowerName.includes("agile") || folderName === "agile";
        const isOS = lowerName.includes("cs304") || lowerName.includes("os") || folderName === "os";
        const isTOC = lowerName.includes("cs302") || lowerName.includes("toc") || folderName === "toc";
        const isDBMS = lowerName.includes("cs301") || lowerName.includes("dbms") || folderName === "dbms";

        if (isAgile) {
            if (lowerName.includes("manifesto") || lowerName.includes("principles")) {
                dbTitle = "Unit 1 - Agile Manifesto Principles.pdf";
                subcategory = "Unit 1 - Introduction to Agile";
                unitNumber = "1";
            } else if (lowerName.includes("comparison") || lowerName.includes("waterfall")) {
                dbTitle = "Unit 1 - Waterfall vs Agile Comparison.pdf";
                subcategory = "Unit 1 - Introduction to Agile";
                unitNumber = "1";
            } else if (lowerName.includes("scrum guide")) {
                dbTitle = "Unit 2 - Scrum Guide Summary.pdf";
                subcategory = "Unit 2 - Scrum Framework";
                unitNumber = "2";
            } else if (lowerName.includes("sprint planning") || lowerName.includes("backlog")) {
                dbTitle = "Unit 2 - Sprint Planning & Backlog Grooming.pdf";
                subcategory = "Unit 2 - Scrum Framework";
                unitNumber = "2";
            } else if (lowerName.includes("user stories") || lowerName.includes("acceptance")) {
                dbTitle = "Unit 3 - User Stories & Acceptance Criteria.pdf";
                subcategory = "Unit 3 - Agile Requirements";
                unitNumber = "3";
            } else if (lowerName.includes("estimation") || lowerName.includes("story point")) {
                dbTitle = "Unit 3 - Story Point Estimation Techniques.pdf";
                subcategory = "Unit 3 - Agile Requirements";
                unitNumber = "3";
            } else if (lowerName.includes("tdd") || lowerName.includes("refactoring")) {
                dbTitle = "Unit 4 - TDD & Refactoring Best Practices.pdf";
                subcategory = "Unit 4 - Extreme Programming";
                unitNumber = "4";
            } else if (lowerName.includes("pair programming")) {
                dbTitle = "Unit 4 - Pair Programming Guidelines.pdf";
                subcategory = "Unit 4 - Extreme Programming";
                unitNumber = "4";
            }
        } else if (isOS) {
            if (lowerName.includes("states") || lowerName.includes("transition")) {
                dbTitle = "Unit 1 - Process States & Transition.pdf";
                subcategory = "Unit 1 - Introduction & Processes";
                unitNumber = "1";
            } else if (lowerName.includes("system calls")) {
                dbTitle = "Unit 1 - System Calls Overview.pdf";
                subcategory = "Unit 1 - Introduction & Processes";
                unitNumber = "1";
            } else if (lowerName.includes("disk scheduling")) {
                dbTitle = "Unit 5 - Disk Scheduling Algorithms.pdf";
                subcategory = "Unit 5 - Storage & File Systems";
                unitNumber = "5";
            } else if (lowerName.includes("scheduling")) {
                dbTitle = "Unit 2 - Scheduling Algorithms (FCFS, SJF, RR).pdf";
                subcategory = "Unit 2 - CPU Scheduling";
                unitNumber = "2";
            } else if (lowerName.includes("synchronization")) {
                dbTitle = "Unit 2 - Classic Synchronization Problems.pdf";
                subcategory = "Unit 2 - CPU Scheduling";
                unitNumber = "2";
            } else if (lowerName.includes("banker")) {
                dbTitle = "Unit 3 - Bankers Algorithm Example.pdf";
                subcategory = "Unit 3 - Deadlocks";
                unitNumber = "3";
            } else if (lowerName.includes("paging") || lowerName.includes("segmentation")) {
                dbTitle = "Unit 4 - Paging & Segmentation.pdf";
                subcategory = "Unit 4 - Memory Management";
                unitNumber = "4";
            } else if (lowerName.includes("replacement")) {
                dbTitle = "Unit 4 - Page Replacement Algorithms.pdf";
                subcategory = "Unit 4 - Memory Management";
                unitNumber = "4";
            } else if (lowerName.includes("file allocation")) {
                dbTitle = "Unit 5 - File Allocation Methods.pdf";
                subcategory = "Unit 5 - Storage & File Systems";
                unitNumber = "5";
            }
        } else if (isTOC) {
            if (lowerName.includes("finite") || lowerName.includes("dfa") || lowerName.includes("nfa")) {
                dbTitle = "Unit 1 - DFA and NFA Diagrams.pdf";
                subcategory = "Unit 1 - Finite Automata";
                unitNumber = "1";
            } else if (lowerName.includes("epsilon")) {
                dbTitle = "Unit 1 - Epsilon Transitions.pdf";
                subcategory = "Unit 1 - Finite Automata";
                unitNumber = "1";
            } else if (lowerName.includes("pumping")) {
                dbTitle = "Unit 2 - Pumping Lemma for Regular Languages.pdf";
                subcategory = "Unit 2 - Regular Languages";
                unitNumber = "2";
            } else if (lowerName.includes("expressions") || lowerName.includes("regular")) {
                dbTitle = "Unit 2 - Regular Expressions Guide.pdf";
                subcategory = "Unit 2 - Regular Languages";
                unitNumber = "2";
            } else if (lowerName.includes("equivalence")) {
                dbTitle = "Unit 4 - Equivalence of PDA and CFG.pdf";
                subcategory = "Unit 4 - Pushdown Automata";
                unitNumber = "4";
            } else if (lowerName.includes("grammar") || lowerName.includes("cfg")) {
                dbTitle = "Unit 3 - Context-Free Grammars.pdf";
                subcategory = "Unit 3 - Context-Free Grammars";
                unitNumber = "3";
            } else if (lowerName.includes("chomsky") || lowerName.includes("cnf")) {
                dbTitle = "Unit 3 - Chomsky Normal Form.pdf";
                subcategory = "Unit 3 - Context-Free Grammars";
                unitNumber = "3";
            } else if (lowerName.includes("pda") || lowerName.includes("pushdown")) {
                dbTitle = "Unit 4 - PDA Constructions.pdf";
                subcategory = "Unit 4 - Pushdown Automata";
                unitNumber = "4";
            } else if (lowerName.includes("turing")) {
                dbTitle = "Unit 5 - Turing Machine Design.pdf";
                subcategory = "Unit 5 - Turing Machines";
                unitNumber = "5";
            } else if (lowerName.includes("halting") || lowerName.includes("decidability")) {
                dbTitle = "Unit 5 - Halting Problem & Decidability.pdf";
                subcategory = "Unit 5 - Turing Machines";
                unitNumber = "5";
            }
        } else if (isDBMS) {
            if (lowerName.includes("introduction") || lowerName.includes("intro")) {
                dbTitle = "Unit 1 - Introduction to DBMS.pdf";
                subcategory = "Unit 1 - Introduction to Databases";
                unitNumber = "1";
            } else if (lowerName.includes("architecture")) {
                dbTitle = "Unit 1 - Database Architecture Overview.pdf";
                subcategory = "Unit 1 - Introduction to Databases";
                unitNumber = "1";
            } else if (lowerName.includes("notation") || lowerName.includes("er diagram")) {
                dbTitle = "Unit 2 - ER Diagram Notation Guide.pdf";
                subcategory = "Unit 2 - ER Model";
                unitNumber = "2";
            } else if (lowerName.includes("relational model") || lowerName.includes("concepts")) {
                dbTitle = "Unit 2 - Relational Model Concepts.pdf";
                subcategory = "Unit 2 - ER Model";
                unitNumber = "2";
            } else if (lowerName.includes("concurrency")) {
                dbTitle = "Unit 5 - Concurrency Control Basics.pdf";
                subcategory = "Unit 5 - Transactions";
                unitNumber = "5";
            } else if (lowerName.includes("sql basics") || lowerName.includes("basics")) {
                dbTitle = "Unit 3 - SQL Basics.pdf";
                subcategory = "Unit 3 - SQL Queries";
                unitNumber = "3";
            } else if (lowerName.includes("joins")) {
                dbTitle = "Unit 3 - Joins.pdf";
                subcategory = "Unit 3 - SQL Queries";
                unitNumber = "3";
            } else if (lowerName.includes("nested")) {
                dbTitle = "Unit 3 - Nested Queries.pdf";
                subcategory = "Unit 3 - SQL Queries";
                unitNumber = "3";
            } else if (lowerName.includes("procedures")) {
                dbTitle = "Unit 3 - Stored Procedures.pdf";
                subcategory = "Unit 3 - SQL Queries";
                unitNumber = "3";
            } else if (lowerName.includes("guidelines") || lowerName.includes("normalization")) {
                dbTitle = "Unit 4 - Normalization Guidelines (1NF to BCNF).pdf";
                subcategory = "Unit 4 - Normalization";
                unitNumber = "4";
            } else if (lowerName.includes("dependencies")) {
                dbTitle = "Unit 4 - Functional Dependencies.pdf";
                subcategory = "Unit 4 - Normalization";
                unitNumber = "4";
            } else if (lowerName.includes("acid") || lowerName.includes("cheat sheet")) {
                dbTitle = "Unit 5 - ACID Properties Cheat Sheet.pdf";
                subcategory = "Unit 5 - Transactions";
                unitNumber = "5";
            }
        }
    }

    return { category, subcategory, unitNumber, dbTitle };
};

async function main() {
    console.log("==================================================");
    console.log("STARTING COURSE MATERIAL SEEDING SCRIPT");
    console.log("==================================================");

    // 1. Ensure the DB tables are migrated / updated with new columns
    console.log("Running self-healing database migrations...");
    try {
        await db.execute(sql`
            ALTER TABLE "Material" 
            ADD COLUMN IF NOT EXISTS "subcategory" text,
            ADD COLUMN IF NOT EXISTS "unitNumber" text,
            ADD COLUMN IF NOT EXISTS "uploadedBy" text DEFAULT 'FACULTY',
            ADD COLUMN IF NOT EXISTS "updatedAt" timestamp;
        `);
        console.log("Migrations applied successfully!");
    } catch (e) {
        console.warn("Self-healing migrations warning:", e);
    }

    // Clean up previous system-seeded materials to allow fresh, clean re-seeding
    console.log("Cleaning up previous system-seeded materials...");
    try {
        const deleted = await db.delete(materials).where(eq(materials.uploadedBy, 'SYSTEM')).returning();
        console.log(`Successfully deleted ${deleted.length} old system-seeded materials.`);
    } catch (err) {
        console.warn("Cleanup warning (materials might be empty):", err);
    }

    // 2. Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env");
        process.exit(1);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Find pdfs folder
    let pdfsDir = "C:\\Users\\susanna\\OneDrive\\Desktop\\pdfs";
    if (!fs.existsSync(pdfsDir)) {
        pdfsDir = path.join(process.cwd(), "pdfs");
    }
    
    if (!fs.existsSync(pdfsDir)) {
        console.error(`ERROR: PDFs directory not found at ${pdfsDir}`);
        process.exit(1);
    }
    console.log(`Found PDFs directory at: ${pdfsDir}`);

    // 4. Fetch all DB courses
    const dbCourses = await db.select().from(courses);
    console.log(`Fetched ${dbCourses.length} courses from database.`);

    // 5. Scan course folders inside pdfs directory
    const folders = fs.readdirSync(pdfsDir).filter(name => {
        const fullPath = path.join(pdfsDir, name);
        return fs.statSync(fullPath).isDirectory();
    });

    console.log(`Discovered course folders: ${folders.join(", ")}`);

    for (const folder of folders) {
        console.log(`\nProcessing folder: "${folder}"...`);
        const folderPath = path.join(pdfsDir, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".pdf"));
        console.log(`Found ${files.length} PDF files inside "${folder}" directory.`);

        for (const file of files) {
            const course = getCourseMatch(folder, file, dbCourses);
            if (!course) {
                console.log(`[SEED LOG] File: ${file} | Folder: ${folder} | Status: SKIPPED (No matching course in database)`);
                continue;
            }

            const courseId = course.id;
            const courseName = course.title;
            const filePath = path.join(folderPath, file);
            const { category, subcategory, unitNumber, dbTitle } = mapFileMetadata(folder, file);

            try {
                // Check if file is already seeded in the database
                const existing = await db.select()
                    .from(materials)
                    .where(and(
                        eq(materials.courseId, courseId),
                        eq(materials.title, dbTitle)
                    ));

                if (existing.length > 0) {
                    console.log(`[SEED LOG] Course: ${courseName} | File Name: ${dbTitle} | Category: ${category} | Status: SKIPPED (Duplicate)`);
                    continue;
                }

                // Read file to upload
                const fileBuffer = fs.readFileSync(filePath);
                const fileExt = file.split('.').pop();
                const storagePath = `${courseId}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${fileExt}`;

                console.log(`Uploading file "${file}" for course "${courseName}"...`);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(storagePath, fileBuffer, {
                        contentType: 'application/pdf',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw uploadError;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('materials')
                    .getPublicUrl(storagePath);

                const sizeStr = getFormattedFileSize(filePath);

                // Insert database record
                const result = await db.insert(materials).values({
                    id: crypto.randomUUID(),
                    courseId,
                    title: dbTitle,
                    fileUrl: publicUrl,
                    fileType: 'application/pdf',
                    size: sizeStr,
                    category,
                    subcategory: subcategory || null,
                    unitNumber: unitNumber || null,
                    uploadedBy: 'SYSTEM',
                    updatedAt: new Date(),
                    createdAt: new Date()
                }).returning();

                if (result.length > 0) {
                    console.log(`[SEED LOG] Course: ${courseName} | File Name: ${dbTitle} | Category: ${category} | Status: SUCCESS`);
                } else {
                    console.log(`[SEED LOG] Course: ${courseName} | File Name: ${dbTitle} | Category: ${category} | Status: FAILED (Database insert failed)`);
                }

            } catch (err: any) {
                console.error(`[SEED LOG] Course: ${courseName} | File Name: ${dbTitle} | Category: ${category} | Status: FAILED (${err.message || err})`);
            }
        }
    }

    console.log("\n==================================================");
    console.log("SEEDING SCRIPT COMPLETED SUCCESSFULLY");
    console.log("==================================================");
    process.exit(0);
}

main().catch(err => {
    console.error("Critical script error:", err);
    process.exit(1);
});
