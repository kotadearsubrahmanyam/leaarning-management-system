import "dotenv/config";
import { db } from "../src/db";
import { users, courses } from "../src/db/schema";
import { eq, and, like } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";

// We will generate the PDF dynamically using jsPDF inside main()

async function main() {
  try {
    console.log("Connecting to database...");

    // 1. Fetch 3rd-semester students starting with '25'
    const studentsList = await db.select({
      id: users.id,
      name: users.name,
      rollNumber: users.rollNumber,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "STUDENT"),
        eq(users.semester, 3),
        like(users.rollNumber, "25CSE%")
      )
    );

    // 2. Fetch 3rd-semester courses
    // For BBA cohort (25BBA...), we want BBA courses. Let's fetch all 3rd-semester courses.
    const coursesList = await db.select({
      id: courses.id,
      title: courses.title,
    })
    .from(courses)
    .where(eq(courses.semester, 3));

    if (studentsList.length === 0) {
      console.log("No 3rd-semester students starting with '25' found in the database.");
      return;
    }

    // We filter courses to the 4 BBA ones if the students are BBA
    // Let's print out what we found
    console.log(`Found ${studentsList.length} students (e.g. ${studentsList[0].rollNumber})`);
    console.log(`Found ${coursesList.length} courses in Semester 3`);

    // Let's filter to BBA courses if BBA students are detected
    let targetCourses = coursesList;
    const isBba = studentsList[0].rollNumber?.startsWith("25BBA");
    if (isBba) {
      // BBA specific courses from the DB
      const bbaTitles = [
        "Human Resource Management",
        "Financial Management",
        "Business Law",
        "Management Information Systems"
      ];
      targetCourses = coursesList.filter(c => bbaTitles.includes(c.title));
      if (targetCourses.length === 0) {
        // Fallback to first 4 courses if titles don't match exactly
        targetCourses = coursesList.slice(0, 4);
      }
    } else {
      // CSE specific courses or first 4
      targetCourses = coursesList.slice(0, 4);
    }

    console.log(`Using target courses for mock generation:`, targetCourses.map(c => c.title));

    // 3. Create target directory
    const outputDir = path.join(process.cwd(), "mock_exam_papers");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    let filesCreatedCount = 0;

    // Generate valid 2-page PDF buffer with jsPDF
    const doc = new jsPDF();
    doc.text("Page 1: Student Identity Info", 10, 10);
    doc.addPage();
    doc.text("Page 2: Exam Answers and Content", 10, 10);
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // 4. Create subfolders and write files
    targetCourses.forEach(course => {
      // Clean course title for folder name
      const folderName = course.title.replace(/[^a-zA-Z0-9]/g, "_");
      const courseFolder = path.join(outputDir, folderName);

      if (!fs.existsSync(courseFolder)) {
        fs.mkdirSync(courseFolder);
      }

      studentsList.forEach(student => {
        if (!student.rollNumber) return;
        
        // Naming standard: RollNumber_CourseTitle.pdf
        const fileName = `${student.rollNumber}_${folderName}.pdf`;
        const filePath = path.join(courseFolder, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        filesCreatedCount++;
      });
    });

    console.log(`\n🎉 Success! Created ${filesCreatedCount} mock exam papers.`);
    console.log(`Files location: ${outputDir}`);
    console.log(`Structure: 4 folders (one per course) containing PDFs named 'RollNumber_Subject.pdf'`);

  } catch (error) {
    console.error("Error generating mock papers:", error);
  }
}

main().then(() => process.exit(0));
