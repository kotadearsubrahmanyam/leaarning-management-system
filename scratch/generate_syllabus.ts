import { jsPDF } from "jspdf";
import * as fs from "fs";
import * as path from "path";

const pdfsDir = "C:\\Users\\susanna\\OneDrive\\Desktop\\pdfs";

async function main() {
    console.log("Generating Syllabus PDFs using jsPDF...");

    // Create directories if they don't exist
    const dbmsDir = path.join(pdfsDir, "dbms");
    const tocDir = path.join(pdfsDir, "toc");

    fs.mkdirSync(dbmsDir, { recursive: true });
    fs.mkdirSync(tocDir, { recursive: true });

    // Helper to add multiline text with custom formatting
    const addSection = (doc: jsPDF, title: string, content: string, startY: number): number => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, 20, startY);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, startY + 7);
        
        return startY + 12 + (lines.length * 5);
    };

    // 1. DBMS Complete Syllabus
    const dbmsComplete = new jsPDF();
    dbmsComplete.setFontSize(22);
    dbmsComplete.setFont("helvetica", "bold");
    dbmsComplete.text("DBMS (CS301)", 20, 25);
    dbmsComplete.setFontSize(16);
    dbmsComplete.text("Complete Syllabus", 20, 40);
    
    let y = 55;
    y = addSection(dbmsComplete, "Course Overview", "Database Management Systems focus on the design, implementation, and management of databases for efficient storage, retrieval, and security of data.", y);
    y = addSection(dbmsComplete, "Course Objectives", "Develop an understanding of relational database concepts, query languages, normalization techniques, and transaction management.", y);
    y = addSection(dbmsComplete, "Learning Outcomes", "Students will be able to design database schemas, write SQL queries, optimize data storage, and ensure data integrity and security.", y);
    y = addSection(dbmsComplete, "Prerequisites", "Programming fundamentals and basic knowledge of data structures.", y);

    fs.writeFileSync(
        path.join(dbmsDir, "Complete_Syllabus_CS301.pdf"),
        Buffer.from(dbmsComplete.output("arraybuffer"))
    );
    console.log("Generated Complete_Syllabus_CS301.pdf");

    // 2. DBMS Unit-wise Syllabus Breakdown
    const dbmsBreakdown = new jsPDF();
    dbmsBreakdown.setFontSize(22);
    dbmsBreakdown.setFont("helvetica", "bold");
    dbmsBreakdown.text("DBMS (CS301)", 20, 25);
    dbmsBreakdown.setFontSize(16);
    dbmsBreakdown.text("Unit-wise Syllabus Breakdown", 20, 40);
    
    y = 55;
    y = addSection(dbmsBreakdown, "Unit 1 - Introduction to DBMS", "Database concepts, file systems versus DBMS, database architecture, data models, schemas, and three-level architecture.", y);
    y = addSection(dbmsBreakdown, "Unit 2 - Relational Model & SQL", "Relational algebra, relational calculus, SQL queries, joins, views, constraints, and subqueries.", y);
    y = addSection(dbmsBreakdown, "Unit 3 - Database Design", "Entity-Relationship (ER) modeling, normalization, functional dependencies, and schema design.", y);
    y = addSection(dbmsBreakdown, "Unit 4 - Transaction Management", "Transactions, concurrency control, locking protocols, serializability, recovery techniques, and ACID properties.", y);
    y = addSection(dbmsBreakdown, "Unit 5 - Advanced Database Concepts", "Indexing, query optimization, NoSQL databases, distributed databases, data warehousing, and database security.", y);

    fs.writeFileSync(
        path.join(dbmsDir, "Unit_wise_Syllabus_Breakdown_CS301.pdf"),
        Buffer.from(dbmsBreakdown.output("arraybuffer"))
    );
    console.log("Generated Unit_wise_Syllabus_Breakdown_CS301.pdf");

    // 3. TOC Complete Syllabus
    const tocComplete = new jsPDF();
    tocComplete.setFontSize(22);
    tocComplete.setFont("helvetica", "bold");
    tocComplete.text("TOC (CS302)", 20, 25);
    tocComplete.setFontSize(16);
    tocComplete.text("Complete Syllabus", 20, 40);
    
    y = 55;
    y = addSection(tocComplete, "Course Overview", "Theory of Computation introduces the mathematical foundations of computer science, focusing on formal models of computation and language recognition.", y);
    y = addSection(tocComplete, "Course Objectives", "Understand automata theory, formal languages, computability, and complexity concepts used in compiler design, artificial intelligence, and algorithm analysis.", y);
    y = addSection(tocComplete, "Learning Outcomes", "Students will be able to design finite automata, construct grammars, analyze language classes, and evaluate the computability of problems.", y);
    y = addSection(tocComplete, "Prerequisites", "Discrete Mathematics, Data Structures, and basic knowledge of algorithms.", y);

    fs.writeFileSync(
        path.join(tocDir, "Complete_Syllabus_CS302.pdf"),
        Buffer.from(tocComplete.output("arraybuffer"))
    );
    console.log("Generated Complete_Syllabus_CS302.pdf");

    // 4. TOC Unit-wise Syllabus Breakdown
    const tocBreakdown = new jsPDF();
    tocBreakdown.setFontSize(22);
    tocBreakdown.setFont("helvetica", "bold");
    tocBreakdown.text("TOC (CS302)", 20, 25);
    tocBreakdown.setFontSize(16);
    tocBreakdown.text("Unit-wise Syllabus Breakdown", 20, 40);
    
    y = 55;
    y = addSection(tocBreakdown, "Unit 1 - DFA & NFA", "Study of finite automata, state transitions, deterministic finite automata (DFA), nondeterministic finite automata (NFA), and epsilon-NFA conversions.", y);
    y = addSection(tocBreakdown, "Unit 2 - Regular Languages", "Regular expressions, regular languages, closure properties, minimization of finite automata, and the pumping lemma.", y);
    y = addSection(tocBreakdown, "Unit 3 - Context-Free Grammars", "Context-free grammars (CFGs), derivations, parse trees, ambiguity, simplification techniques, and Chomsky Normal Form (CNF).", y);
    y = addSection(tocBreakdown, "Unit 4 - Pushdown Automata", "Stack-based automata, PDA design, acceptance conditions, and the equivalence between PDAs and CFGs.", y);
    y = addSection(tocBreakdown, "Unit 5 - Turing Machines & Decidability", "Turing Machines, decidability, recursive and recursively enumerable languages, reductions, and the halting problem.", y);

    fs.writeFileSync(
        path.join(tocDir, "Unit_wise_Syllabus_Breakdown_CS302.pdf"),
        Buffer.from(tocBreakdown.output("arraybuffer"))
    );
    console.log("Generated Unit_wise_Syllabus_Breakdown_CS302.pdf");

    // Clean up misplaced syllabus file in toc folder if it exists
    const misplacedPath = path.join(tocDir, "Complete_Syllabus_CS301.pdf");
    if (fs.existsSync(misplacedPath)) {
        fs.unlinkSync(misplacedPath);
        console.log("Removed misplaced Complete_Syllabus_CS301.pdf from toc folder");
    }
}

main().catch(console.error);
