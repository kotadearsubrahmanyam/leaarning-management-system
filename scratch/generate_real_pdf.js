const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

// Helper to escape HTML special characters
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Simple markdown line-by-line parser for SQL queries notes
function parseMarkdownToHtml(md) {
    let html = '';
    const lines = md.split('\n');
    let inList = false;
    let inCode = false;
    let codeLang = '';
    let codeBlock = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code block toggle
        if (line.trim().startsWith('```')) {
            if (inCode) {
                inCode = false;
                html += `<pre><code class="language-${codeLang}">${escapeHtml(codeBlock.trim())}</code></pre>\n`;
                codeBlock = '';
            } else {
                inCode = true;
                codeLang = line.trim().slice(3) || 'sql';
            }
            continue;
        }

        if (inCode) {
            codeBlock += line + '\n';
            continue;
        }

        // Horizontal Rule
        if (line.trim() === '---') {
            html += '<hr/>\n';
            continue;
        }

        // Headings
        if (line.startsWith('# ')) {
            html += `<h1>${line.slice(2).trim()}</h1>\n`;
            continue;
        }
        if (line.startsWith('## ')) {
            html += `<h2>${line.slice(3).trim()}</h2>\n`;
            continue;
        }
        if (line.startsWith('### ')) {
            html += `<h3>${line.slice(4).trim()}</h3>\n`;
            continue;
        }
        if (line.startsWith('#### ')) {
            html += `<h4>${line.slice(5).trim()}</h4>\n`;
            continue;
        }

        // Unordered lists
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            if (!inList) {
                inList = true;
                html += '<ul>\n';
            }
            // Strip bullet point and wrap text
            let content = line.trim().slice(2).trim();
            // Simple inline bold formatting
            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            content = content.replace(/`(.*?)`/g, '<code>$1</code>');
            html += `<li>${content}</li>\n`;
            continue;
        } else if (inList && line.trim() === '') {
            // Blank line closes lists if next line is not a list
            let nextLine = lines[i+1];
            if (!nextLine || (!nextLine.trim().startsWith('* ') && !nextLine.trim().startsWith('- '))) {
                inList = false;
                html += '</ul>\n';
            }
            continue;
        }

        // Plain paragraph
        if (line.trim() !== '') {
            let content = line.trim();
            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            content = content.replace(/`(.*?)`/g, '<code>$1</code>');
            html += `<p>${content}</p>\n`;
        }
    }

    if (inList) {
        html += '</ul>\n';
    }

    return html;
}

async function main() {
    const scratchDir = __dirname;
    const projectRoot = path.resolve(scratchDir, '..');
    const writeNotesScript = path.join(scratchDir, 'write_unit3_notes.mjs');
    
    // Read the markdown content from the existing write script
    if (!fs.existsSync(writeNotesScript)) {
        console.error(`Script not found at: ${writeNotesScript}`);
        process.exit(1);
    }
    
    console.log("Reading markdown from script...");
    const scriptContent = fs.readFileSync(writeNotesScript, 'utf8');
    
    // Extract the markdown template literal
    const startMatch = scriptContent.indexOf('const markdownContent = `');
    if (startMatch === -1) {
        console.error("Could not find markdownContent template literal in write_unit3_notes.mjs");
        process.exit(1);
    }
    
    const startIdx = startMatch + 'const markdownContent = `'.length;
    const endIdx = scriptContent.indexOf('`;', startIdx);
    if (endIdx === -1) {
        console.error("Could not find end of markdownContent template literal");
        process.exit(1);
    }
    
    const markdown = scriptContent.slice(startIdx, endIdx);
    console.log(`Successfully extracted ${markdown.length} characters of markdown.`);
    
    // Parse markdown to HTML
    console.log("Converting markdown to styled HTML...");
    const parsedContent = parseMarkdownToHtml(markdown);
    
    // HTML wrapper with rich styling matching the university theme (Deep Purple/Indigo and Rose accents)
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Database Management Systems (DBMS) - Unit 3 Notes</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;600;700&display=swap');
        
        @page {
            size: A4;
            margin: 2.2cm 2cm 2.2cm 2cm;
            @bottom-right {
                content: counter(page);
                font-family: 'Inter', sans-serif;
                font-size: 9px;
                color: #94a3b8;
            }
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            font-size: 10.5pt;
        }
        
        h1, h2, h3, h4 {
            font-family: 'Outfit', sans-serif;
            color: #0f172a;
            font-weight: 800;
            page-break-after: avoid;
        }
        
        h1 {
            font-size: 24pt;
            text-align: center;
            margin-top: 0;
            margin-bottom: 5px;
            color: #6b21a8; /* Purple primary */
        }
        
        h2 {
            font-size: 15pt;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 12px;
            color: #4f46e5; /* Indigo */
        }
        
        h3 {
            font-size: 12pt;
            margin-top: 18px;
            margin-bottom: 8px;
            color: #0f172a;
        }
        
        h4 {
            font-size: 11pt;
            margin-top: 15px;
            margin-bottom: 6px;
            color: #475569;
        }
        
        p {
            margin-top: 0;
            margin-bottom: 10px;
            text-align: justify;
        }
        
        ul {
            margin-top: 0;
            margin-bottom: 12px;
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        strong {
            color: #0f172a;
            font-weight: 700;
        }
        
        code {
            font-family: 'Courier New', Courier, monospace;
            background-color: #f1f5f9;
            color: #e11d48; /* Crimson highlight */
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 9pt;
        }
        
        pre {
            background-color: #0f172a; /* Dark editor background */
            color: #f8fafc;
            padding: 12px 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin-top: 8px;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        pre code {
            font-family: 'Consolas', 'Courier New', Courier, monospace;
            background-color: transparent;
            color: #38bdf8; /* Light blue code text */
            padding: 0;
            border-radius: 0;
            font-size: 9.5pt;
            line-height: 1.4;
        }
        
        hr {
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 20px 0;
            page-break-after: avoid;
        }
        
        /* Table of contents and solved questions */
        .toc-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px 20px;
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .toc-title {
            font-family: 'Outfit', sans-serif;
            font-size: 12pt;
            font-weight: 800;
            margin-bottom: 10px;
            color: #6b21a8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        /* Exam tips */
        .exam-tip {
            background-color: #fff1f2; /* Rose alert background */
            border-left: 4px solid #f43f5e; /* Rose left border */
            padding: 10px 15px;
            border-radius: 0 8px 8px 0;
            margin: 15px 0;
            page-break-inside: avoid;
        }
        
        .exam-tip-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            color: #be123c;
            margin-bottom: 4px;
            font-size: 10pt;
            text-transform: uppercase;
        }
        
        .exam-tip p {
            margin: 0;
            font-size: 9.5pt;
            color: #4c0519;
        }
        
        /* Cover page subtitle and header styling */
        .subtitle {
            font-size: 11pt;
            text-align: center;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .header-meta {
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 25px;
        }
        
        /* SOLVED EXAMPLES */
        .solved-example {
            background-color: #eff6ff; /* Light blue box */
            border: 1px solid #bfdbfe;
            padding: 12px 18px;
            border-radius: 12px;
            margin: 15px 0;
            page-break-inside: avoid;
        }
        
        .solved-example h4 {
            color: #1d4ed8;
            margin-top: 0;
            font-weight: 800;
        }
    </style>
</head>
<body>
    <h1>Database Management Systems (DBMS)</h1>
    <div class="subtitle">Course Code: CSE302 | Semester: III | Academic Year: 2026-2027</div>
    <div class="header-meta">Unit III: Structured Query Language (SQL) & Database Programming</div>
    
    <div class="toc-box">
        <div class="toc-title">Table of Contents</div>
        <p style="margin: 0; font-size: 9.5pt; line-height: 1.7;">
            1. Learning Objectives &amp; Introduction • 2. Core SQL Divisions (DDL, DML, DCL, TCL) • 3. SQL Constraints • 4. SQL Joins (Inner, Left, Right, Full, Self) • 5. Nested Queries &amp; Subqueries • 6. PL/SQL Stored Procedures, Functions, &amp; Triggers • 7. Solved University Questions • 8. Exam Tips &amp; Viva Cheat Sheet
        </p>
    </div>
    
    ${parsedContent}
</body>
</html>
    `;
    
    // Write temporary HTML file
    const tempHtmlPath = path.join(scratchDir, 'temp_unit3_notes.html');
    fs.writeFileSync(tempHtmlPath, htmlTemplate, 'utf8');
    console.log(`Temporary HTML written to: ${tempHtmlPath}`);
    
    // Launch puppeteer and generate PDF
    console.log("Launching headless browser via Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Load local HTML file
    console.log("Loading HTML content...");
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Make sure public/uploads exists
    const uploadsDir = path.join(projectRoot, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const pdfPath = path.join(uploadsDir, 'unit3-sql-basics.pdf');
    console.log(`Printing PDF to: ${pdfPath}...`);
    
    // Print to PDF
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: '<span style="font-size: 8px; font-family: Inter, sans-serif; color: #94a3b8; margin: 0 auto; width: 100%; text-align: center;">CSE302: Database Management Systems - Unit III Study Notes</span>',
        footerTemplate: '<span style="font-size: 8px; font-family: Inter, sans-serif; color: #94a3b8; margin: 0 auto; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>',
        margin: {
            top: '2.5cm',
            bottom: '2.5cm',
            left: '2cm',
            right: '2cm'
        }
    });
    
    await browser.close();
    console.log("PDF successfully generated!");
    
    // Delete temporary HTML file
    fs.unlinkSync(tempHtmlPath);
    console.log("Cleaned up temporary HTML file.");
    
    // Calculate PDF size
    const stats = fs.statSync(pdfPath);
    const pdfSize = `${(stats.size / 1024).toFixed(1)} KB`;
    console.log(`Generated PDF Size: ${pdfSize}`);
    
    // Update the database record using pg
    console.log("Updating database record...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        // Find if record exists with the markdown name or pdf name
        const checkRes = await pool.query(
            'SELECT * FROM "Material" WHERE "courseId" = $1 AND ("title" = $2 OR "title" = $3)',
            ['eb8032e7-bb12-48fc-ab3c-9d7404bb5ef9', 'SQL Basics.md', 'Unit 3 - SQL Basics.pdf']
        );
        
        if (checkRes.rows.length > 0) {
            const materialId = checkRes.rows[0].id;
            console.log(`Found existing material ID: ${materialId}. Updating...`);
            
            const updateRes = await pool.query(
                'UPDATE "Material" SET "title" = $1, "fileUrl" = $2, "fileType" = $3, "size" = $4 WHERE "id" = $5 RETURNING *',
                [
                    'Unit 3 - SQL Basics.pdf',
                    '/uploads/unit3-sql-basics.pdf',
                    'application/pdf',
                    pdfSize,
                    materialId
                ]
            );
            console.log("Updated record:", updateRes.rows[0]);
        } else {
            console.log("Material record not found, inserting a new one...");
            const insertRes = await pool.query(
                'INSERT INTO "Material" ("id", "courseId", "category", "title", "fileUrl", "fileType", "size") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [
                    crypto.randomUUID ? crypto.randomUUID() : '1ecfb8fb-dff8-4a25-a97c-82c5e67f3472', // Use previous ID or generate
                    'eb8032e7-bb12-48fc-ab3c-9d7404bb5ef9',
                    'UNIT_NOTES',
                    'Unit 3 - SQL Basics.pdf',
                    '/uploads/unit3-sql-basics.pdf',
                    'application/pdf',
                    pdfSize
                ]
            );
            console.log("Inserted new record:", insertRes.rows[0]);
        }
    } catch (dbErr) {
        console.error("Database operation failed:", dbErr);
    } finally {
        await pool.end();
    }
    
    console.log("PDF generation and database update complete!");
}

main().catch(console.error);
