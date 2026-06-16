import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, courses, departments, enrollments, results, assignments, attendance, materials, syllabus, certificates, payments, courseFaculty, studentSemesterSummary } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const departmentData = [
  {
    name: "Computer Science and Engineering",
    code: "CSE",
    totalSemesters: 8,
    semesters: [
      ["Linear Algebra and Calculus", "Engineering Graphics", "Programming for Problem Solving using C", "English Communication Skills"],
      ["Engineering Mathematics II", "Data Structures", "Object Oriented Programming through C++", "Java Programming"],
      ["Database Management Systems", "Theory of Computation", "Agile Software Engineering", "Operating Systems"],
      ["Computer Networks", "Cryptography and Network Security", "Compiler Design", "Advanced Data Structures and Algorithm Analysis"],
      ["Machine Learning", "Full Stack Web Development", "Cloud Computing and Virtualization", "Software Testing Methodologies"],
      ["Deep Learning", "Natural Language Processing", "Computer Vision", "DevOps and Software Deployment"],
      ["Generative Artificial Intelligence", "Blockchain Technology", "Major Project Phase I", "Industry Training"],
      ["Advanced Machine Learning Applications", "Software Project Management", "Major Project Phase II", "Seminar and Technical Presentation"]
    ]
  },
  {
    name: "Electronics and Communication Engineering",
    code: "ECE",
    totalSemesters: 8,
    semesters: [
      ["Engineering Mathematics I", "Basic Electronics Engineering", "Electronic Devices and Circuits", "Engineering Graphics"],
      ["Engineering Mathematics II", "Network Theory", "Signals and Systems", "Programming using C"],
      ["Digital Electronics", "Analog Communication", "Microprocessors and Microcontrollers", "Electromagnetic Theory"],
      ["Digital Signal Processing", "Control Systems", "Linear Integrated Circuits", "Computer Organization"],
      ["VLSI Design", "Embedded Systems", "Wireless Communication", "Antennas and Wave Propagation"],
      ["Internet of Things", "Microwave Engineering", "Optical Communication", "Satellite Communication"],
      ["5G Communication Systems", "Robotics and Automation", "Major Project Phase I", "Industry Training"],
      ["AI in Communication Systems", "Advanced Embedded Systems", "Major Project Phase II", "Seminar and Technical Presentation"]
    ]
  },
  {
    name: "Bachelor of Business Administration",
    code: "BBA",
    totalSemesters: 6,
    semesters: [
      ["Principles of Management", "Business Economics", "Financial Accounting", "Business Communication Skills"],
      ["Organizational Behavior", "Business Mathematics", "Marketing Management", "Macroeconomics"],
      ["Human Resource Management", "Financial Management", "Business Law", "Management Information Systems"],
      ["Operations Research", "Research Methodology", "Consumer Behavior", "Business Ethics and CSR"],
      ["Strategic Management", "Entrepreneurship Development", "Investment Analysis", "International Business"],
      ["Project Management", "Retail Management", "Industrial Relations", "Comprehensive Project"]
    ]
  }
];

async function main() {
  console.log("🌱 Starting Massive Data Seeding...");
  console.log("🧹 Truncating all data...");
  await db.delete(studentSemesterSummary);
  await db.delete(certificates);
  await db.delete(syllabus);
  await db.delete(attendance);
  await db.delete(assignments);
  await db.delete(materials);
  await db.delete(results);
  await db.delete(enrollments);
  await db.delete(courseFaculty);
  await db.delete(courses);
  await db.delete(departments);
  await db.delete(users);

  const hashedPassword = await bcrypt.hash("123456", 10);

  console.log("👨‍💼 Creating Admin...");
  await db.insert(users).values({
    name: "System Admin",
    email: "admin@test.com",
    password: hashedPassword,
    role: "ADMIN",
  });

  console.log("📚 Creating Departments...");
  const dbDepartments = await db.insert(departments).values(
    departmentData.map(dept => ({
      name: dept.name,
      description: `${dept.code} Department`,
      typeOfEducation: dept.code === "BBA" ? "BBA" : "B.Tech",
      totalSemesters: dept.totalSemesters,
    }))
  ).returning();

  console.log("👨‍🏫 Creating 36 Faculty Members (12 per Department)...");
  const facultyInserts: any[] = [];
  dbDepartments.forEach((dbDept) => {
    const deptCode = dbDept.description?.split(' ')[0] || "fac";
    for (let i = 1; i <= 12; i++) {
      facultyInserts.push({
        name: `${deptCode} Faculty ${i}`,
        email: `${deptCode.toLowerCase()}faculty${i}@test.com`,
        password: hashedPassword,
        role: "TEACHER" as const,
        departmentId: dbDept.id,
      });
    }
  });
  const allTeachers = await db.insert(users).values(facultyInserts).returning();

  console.log("📚 Creating Courses, Materials, Assignments, and Faculty Mappings...");
  const courseInserts = [];
  const materialInserts = [];
  const assignmentInserts = [];
  const courseFacultyInserts = [];
  const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const oddSemesters = [1, 3, 5, 7];
  
  // We will build these and map them to their IDs later
  // Unfortunately, bulk insert returning isn't easy to map to original items, so we'll do this loop with individual inserts for courses (it's only 16 courses * 3 depts = 48 courses, which is fast).
  
  const createdCourseFacultiesBySemAndDept = new Map(); 

  for (let deptIndex = 0; deptIndex < departmentData.length; deptIndex++) {
    const dept = departmentData[deptIndex];
    const dbDept = dbDepartments[deptIndex];
    const deptTeachers = allTeachers.slice(deptIndex * 12, (deptIndex + 1) * 12);

    for (const semNumber of allSemesters) {
      if (semNumber > dept.totalSemesters) continue;
      const semIndex = semNumber - 1;
      const subjects = dept.semesters[semIndex];
      if (!subjects) continue;
      const semesterData = [];
      let localTeacherIndex = 0;

      for (const subject of subjects) {
        const primaryTeacher = deptTeachers[localTeacherIndex];
        
        let imageUrl = null;
        if (subject === "Human Resource Management") imageUrl = "/thumbnails/human-resource-management.jpg";
        else if (subject === "Financial Management") imageUrl = "/thumbnails/financial-management.jpg";
        else if (subject === "Business Law") imageUrl = "/thumbnails/business-law.jpg";
        else if (subject === "Database Management Systems") imageUrl = "/thumbnails/database-management-systems.jpg";
        else if (subject === "Agile Software Engineering") imageUrl = "/thumbnails/agile-software-engineering.jpg";
        else if (subject === "Operating Systems") imageUrl = "/thumbnails/operating-systems.jpg";
        else if (subject === "Theory of Computation") imageUrl = "/thumbnails/theory-of-computation.jpg";
        else if (subject === "Digital Electronics") imageUrl = "/thumbnails/digital-electronics.jpg";
        else if (subject === "Analog Communication") imageUrl = "/thumbnails/analog-communication.jpg";
        else if (subject === "Microprocessors and Microcontrollers") imageUrl = "/thumbnails/microprocessors-and-microcontrollers.jpg";
        else if (subject === "Electromagnetic Theory") imageUrl = "/thumbnails/electromagnetic-theory.jpg";
        else if (subject === "Management Information Systems") imageUrl = "/thumbnails/management-information-systems.jpg";
        else if (subject === "Java Programming") imageUrl = "/thumbnails/java-programming.jpg";
        else if (subject === "English Communication Skills") imageUrl = "/thumbnails/english-communication-skills.jpg";
        else if (subject === "Engineering Mathematics II") imageUrl = "/thumbnails/engineering-mathematics-2.jpg";
        else if (subject === "Data Structures") imageUrl = "/thumbnails/data-structures.jpg";
        else if (subject === "Linear Algebra and Calculus") imageUrl = "/thumbnails/linear-algebra-and-calculus.jpg";
        else if (subject === "Engineering Graphics") imageUrl = "/thumbnails/engineering-graphics.jpg";
        else if (subject === "Object Oriented Programming through C++") imageUrl = "/thumbnails/object-oriented-programming-through-cpp.jpg";
        else if (subject === "Programming for Problem Solving using C") imageUrl = "/thumbnails/programming-for-problem-solving-using-c.jpg";

        const [course] = await db.insert(courses).values({
          title: subject,
          description: `Study of ${subject} for ${dept.code} Semester ${semNumber}`,
          level: semNumber > 4 ? "Advanced" : "Intermediate",
          semester: semNumber,
          categoryId: dbDept.id,
          teacherId: primaryTeacher.id,
          imageUrl: imageUrl,
        }).returning();

        materialInserts.push({
          courseId: course.id,
          title: `Course Material - ${subject}`,
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileType: "application/pdf",
          size: "1.2 MB",
        });

        assignmentInserts.push({
          courseId: course.id,
          title: `Assignment: ${subject}`,
          description: `Complete the assignment for ${subject}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const assignedCourseFaculties = [];
        for (let i = 0; i < 3; i++) {
          const teacher = deptTeachers[localTeacherIndex];
          localTeacherIndex++;
          const [cf] = await db.insert(courseFaculty).values({
            courseId: course.id,
            teacherId: teacher.id,
            capacity: 20,
          }).returning();
          assignedCourseFaculties.push(cf);
        }
        semesterData.push({ course, faculties: assignedCourseFaculties });
      }
      createdCourseFacultiesBySemAndDept.set(`${dbDept.id}-${semNumber}`, semesterData);
    }
  }

  if (materialInserts.length) await db.insert(materials).values(materialInserts);
  if (assignmentInserts.length) await db.insert(assignments).values(assignmentInserts);

  console.log("👨‍🎓 Creating Students, Enrollments, and Results (Bulk)...");
  
  const studentInserts = [];
  const paymentInserts = [];
  const enrollmentInserts = [];
  const resultInserts = [];
  const summaryInserts = [];

  for (let deptIndex = 0; deptIndex < departmentData.length; deptIndex++) {
    const dept = departmentData[deptIndex];
    const dbDept = dbDepartments[deptIndex];
    
    for (const semNumber of oddSemesters) {
      if (semNumber > dept.totalSemesters) continue;
      const yearPrefix = 27 - Math.floor((semNumber - 1) / 2);
      let rollCounter = 1;

      for (let s = 1; s <= 60; s++) {
        const rollNumberStr = `${yearPrefix}${dept.code}${rollCounter.toString().padStart(3, '0')}`;
        rollCounter++;

        const r = Math.random();
        let residentStatus: "HOSTELER" | "DAYSCHOLAR_BUS" | "DAYSCHOLAR_NORMAL" = "DAYSCHOLAR_NORMAL";
        if (r < 0.3) residentStatus = "HOSTELER";
        else if (r < 0.6) residentStatus = "DAYSCHOLAR_BUS";

        const studentSemester = rollNumberStr === "24CSE001" ? 3 : semNumber;

        studentInserts.push({
          name: `${dept.code} Student ${rollNumberStr}`,
          email: `${rollNumberStr.toLowerCase()}@test.com`,
          password: hashedPassword,
          role: "STUDENT" as const,
          departmentId: dbDept.id,
          semester: studentSemester,
          rollNumber: rollNumberStr,
          residentStatus,
          // meta: We need a way to link students to their assigned faculties without doing it in chunks, 
          // actually since we need their DB `id`, we must insert students first.
        });
      }
    }
  }

  console.log(`Inserting ${studentInserts.length} students...`);
  // Insert students in batches to avoid query size limits (just in case, 540 is usually fine but let's be safe)
  let allStudents: any[] = [];
  for (let i = 0; i < studentInserts.length; i += 100) {
    const chunk = studentInserts.slice(i, i + 100);
    const result = await db.insert(users).values(chunk).returning();
    allStudents = [...allStudents, ...result];
  }

  // Now create enrollments, results, and payments
  for (const student of allStudents) {
    // Payments
    paymentInserts.push({ userId: student.id, amount: 50000, status: "COMPLETED", feeType: "TUITION" as const });
    if (student.residentStatus === "HOSTELER") {
      paymentInserts.push({ userId: student.id, amount: 30000, status: Math.random() > 0.5 ? "COMPLETED" : "PENDING", feeType: "HOSTEL" as const });
    } else if (student.residentStatus === "DAYSCHOLAR_BUS") {
      paymentInserts.push({ userId: student.id, amount: 15000, status: Math.random() > 0.5 ? "COMPLETED" : "PENDING", feeType: "BUS" as const });
    }
  }
  
  if (paymentInserts.length) {
    for (let i = 0; i < paymentInserts.length; i += 200) {
      await db.insert(payments).values(paymentInserts.slice(i, i + 200));
    }
  }

  // To distribute evenly, we filter students by department and semester
  for (let deptIndex = 0; deptIndex < departmentData.length; deptIndex++) {
    const dept = departmentData[deptIndex];
    const dbDept = dbDepartments[deptIndex];
    
    for (const semNumber of oddSemesters) {
      if (semNumber > dept.totalSemesters) continue;
      const semesterCourses = createdCourseFacultiesBySemAndDept.get(`${dbDept.id}-${semNumber}`);
      const semStudents = allStudents.filter(s => s.departmentId === dbDept.id && s.semester === semNumber);
      semStudents.sort((a, b) => {
        if (a.rollNumber === "24CSE001") return -1;
        if (b.rollNumber === "24CSE001") return 1;
        return 0;
      });

      for (const { course, faculties } of semesterCourses) {
        let studentIndex = 0;
        for (const cf of faculties) {
          for (let i = 0; i < 20; i++) {
            if (studentIndex >= semStudents.length) break;
            const student = semStudents[studentIndex];
            
            enrollmentInserts.push({
              studentId: student.id,
              courseId: course.id,
              courseFacultyId: cf.id,
              status: "ACTIVE" as const,
            });

            const isPass = Math.random() > 0.1; 
            let marks = isPass ? Math.floor(Math.random() * 60) + 40 : Math.floor(Math.random() * 39); 
            let grade = "F";
            if (marks >= 90) grade = "A+";
            else if (marks >= 80) grade = "A";
            else if (marks >= 70) grade = "B";
            else if (marks >= 60) grade = "C";
            else if (marks >= 50) grade = "D";
            else if (marks >= 40) grade = "E";

            resultInserts.push({
              userId: student.id,
              courseId: course.id,
              marks,
              grade,
            });

            studentIndex++;
          }
        }
      }

      // Seed past semester results (published) for this student batch
      if (semNumber > 1) {
        for (const student of semStudents) {
          let cumulativePoints = 0;
          let cumulativeCredits = 0;

          for (let prevSem = 1; prevSem < semNumber; prevSem++) {
            const prevSemesterCourses = createdCourseFacultiesBySemAndDept.get(`${dbDept.id}-${prevSem}`);
            if (!prevSemesterCourses) continue;

            let semPoints = 0;
            let semCredits = 0;

            for (const { course } of prevSemesterCourses) {
              const courseCredits = course.credits || 3;
              const isPass = Math.random() > 0.05; // 95% pass rate for past courses
              const marks = isPass ? Math.floor(Math.random() * 50) + 50 : Math.floor(Math.random() * 10) + 30; // 50-100 for pass, 30-40 for fail
              
              let grade = "F";
              let gp = 0;
              if (marks >= 90) { grade = "A+"; gp = 10; }
              else if (marks >= 80) { grade = "A"; gp = 9; }
              else if (marks >= 70) { grade = "B+"; gp = 8; }
              else if (marks >= 60) { grade = "B"; gp = 7; }
              else if (marks >= 50) { grade = "C"; gp = 6; }
              else if (marks >= 40) { grade = "D"; gp = 5; }

              const status = marks >= 40 ? "PASS" : "FAIL";

              resultInserts.push({
                userId: student.id,
                courseId: course.id,
                marks,
                grade,
                status,
                semester: prevSem,
                published: true,
              });

              semPoints += gp * courseCredits;
              semCredits += courseCredits;
            }

            const sgpaVal = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : "0.00";
            cumulativePoints += semPoints;
            cumulativeCredits += semCredits;
            const cgpaVal = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits).toFixed(2) : "0.00";

            summaryInserts.push({
              userId: student.id,
              semester: prevSem,
              sgpa: sgpaVal,
              cgpa: cgpaVal,
              published: true,
            });
          }
        }
      }
    }
  }

  console.log(`Inserting ${enrollmentInserts.length} enrollments...`);
  if (enrollmentInserts.length) {
    for (let i = 0; i < enrollmentInserts.length; i += 500) {
      await db.insert(enrollments).values(enrollmentInserts.slice(i, i + 500));
    }
  }

  console.log(`Inserting ${resultInserts.length} results...`);
  if (resultInserts.length) {
    for (let i = 0; i < resultInserts.length; i += 500) {
      await db.insert(results).values(resultInserts.slice(i, i + 500));
    }
  }

  console.log(`Inserting ${summaryInserts.length} semester summaries...`);
  if (summaryInserts.length) {
    for (let i = 0; i < summaryInserts.length; i += 500) {
      await db.insert(studentSemesterSummary).values(summaryInserts.slice(i, i + 500));
    }
  }

  console.log("✅ Seeding Complete!");
  console.log("-----------------------------------------");
  console.log("Login Credentials:");
  console.log("Admin: admin@test.com / 123456");
  console.log("Faculty: csefaculty1@test.com to csefaculty12@test.com / 123456");
  console.log("         ecefaculty1@test.com to ecefaculty12@test.com / 123456");
  console.log("         bbafaculty1@test.com to bbafaculty12@test.com / 123456");
  console.log("Students:");
  console.log("  CSE: 27cse001@test.com (Sem 1), 26cse001@test.com (Sem 3), 25cse001@test.com (Sem 5), 24cse001@test.com (Sem 7)");
  console.log("  ECE: 27ece001@test.com (Sem 1), 26ece001@test.com (Sem 3), 25ece001@test.com (Sem 5), 24ece001@test.com (Sem 7)");
  console.log("  BBA: 27bba001@test.com (Sem 1), 26bba001@test.com (Sem 3), 25bba001@test.com (Sem 5) [No Sem 7]");
  console.log("All passwords are: 123456");
  console.log("-----------------------------------------");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
