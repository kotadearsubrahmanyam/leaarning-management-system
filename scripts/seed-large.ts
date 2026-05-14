import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, courses, departments, enrollments, results, assignments, attendance, materials, syllabus, certificates, payments } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Data Definitions
const departmentData = [
  {
    name: "Computer Science and Engineering",
    code: "CSE",
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
    name: "Civil Engineering",
    code: "CE",
    semesters: [
      ["Engineering Mathematics I", "Engineering Mechanics", "Engineering Graphics", "Building Materials"],
      ["Engineering Mathematics II", "Surveying", "Strength of Materials", "Environmental Engineering"],
      ["Fluid Mechanics", "Structural Analysis", "Concrete Technology", "Geotechnical Engineering"],
      ["Transportation Engineering", "Hydraulics and Hydraulic Machines", "Design of RCC Structures", "Construction Planning and Management"],
      ["Steel Structures", "Environmental Impact Assessment", "Estimation and Costing", "GIS and Remote Sensing"],
      ["Advanced Structural Engineering", "Smart Cities and Urban Planning", "Earthquake Resistant Structures", "Construction Technology"],
      ["Sustainable Infrastructure Engineering", "Bridge Engineering", "Major Project Phase I", "Industrial Training"],
      ["Advanced Construction Management", "Green Building Technologies", "Major Project Phase II", "Seminar and Technical Presentation"]
    ]
  }
];

async function main() {
  console.log("🌱 Starting Massive Data Seeding...");

  // 1. Clear existing data
  console.log("🧹 Truncating all data...");
  await db.delete(certificates);
  await db.delete(syllabus);
  await db.delete(attendance);
  await db.delete(assignments);
  await db.delete(materials);
  await db.delete(results);
  await db.delete(enrollments);
  await db.delete(courses);
  await db.delete(departments);
  await db.delete(users);

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 2. Create Admin
  console.log("👨‍💼 Creating Admin...");
  await db.insert(users).values({
    name: "System Admin",
    email: "admin@test.com",
    password: hashedPassword,
    role: "ADMIN",
  });

  // We will create the departments first, so we can assign teachers to them.
  console.log("📚 Creating Departments...");
  const dbDepartments = [];
  for (const dept of departmentData) {
    const [dbDept] = await db.insert(departments).values({
      name: dept.name,
      description: `${dept.code} Department`
    }).returning();
    dbDepartments.push(dbDept);
  }

  // 3. Create 48 Teachers (16 per department)
  console.log("👨‍🏫 Creating 48 Faculty Members (16 per Department)...");
  const teachers = [];
  for (const dbDept of dbDepartments) {
    const deptCode = dbDept.description?.split(' ')[0].toLowerCase() || "fac";
    for (let i = 1; i <= 16; i++) {
      const [teacher] = await db.insert(users).values({
        name: `${dbDept.name.split(' ')[0]} Faculty ${i}`,
        email: `${deptCode}faculty${i}@test.com`,
        password: hashedPassword,
        role: "TEACHER",
        departmentId: dbDept.id,
      }).returning();
      teachers.push(teacher);
    }
  }

  // Generate Courses
  console.log("📚 Creating Courses...");
  let teacherIndex = 0;
  const createdCoursesBySemAndDept = new Map(); // Key: `${deptId}-${sem}`
  
  for (let deptIndex = 0; deptIndex < departmentData.length; deptIndex++) {
    const dept = departmentData[deptIndex];
    const dbDept = dbDepartments[deptIndex];
    
    // The teachers for this specific department are in a block of 16
    const deptTeachers = teachers.slice(deptIndex * 16, (deptIndex + 1) * 16);
    let localTeacherIndex = 0;

    const oddSemesters = [1, 3, 5, 7];

    for (const semNumber of oddSemesters) {
      const semIndex = semNumber - 1;
      const subjects = dept.semesters[semIndex];
      const semesterCourses = [];

      for (const subject of subjects) {
        // Assign a teacher from this department's pool
        const teacher = deptTeachers[localTeacherIndex % 16];
        localTeacherIndex++;

        const [course] = await db.insert(courses).values({
          title: subject,
          description: `Study of ${subject} for ${dept.code} Semester ${semNumber}`,
          level: semNumber > 4 ? "Advanced" : "Intermediate",
          semester: semNumber,
          categoryId: dbDept.id,
          teacherId: teacher.id,
        }).returning();

        semesterCourses.push(course);

        // Add Dummy Material
        await db.insert(materials).values({
          courseId: course.id,
          title: `Course Material - ${subject}`,
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileType: "application/pdf",
          size: "1.2 MB",
        });

        // Add 1 Assignment
        await db.insert(assignments).values({
          courseId: course.id,
          title: `Assignment: ${subject}`,
          description: `Complete the assignment for ${subject}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        });
      }

      createdCoursesBySemAndDept.set(`${dbDept.id}-${semNumber}`, semesterCourses);
    }

    // Generate 5 Students per Semester for this Department (Odd semesters only: 1, 3, 5, 7)
    // Assuming current year is 2027 for the 1st sem batch
    console.log(`👨‍🎓 Creating Students for ${dept.code}...`);
    
    for (const semNumber of oddSemesters) {
      const coursesForThisSem = createdCoursesBySemAndDept.get(`${dbDept.id}-${semNumber}`);
      let rollCounter = 1;
      
      // Calculate year prefix. If Sem 1 is 27, Sem 3 is 26, Sem 5 is 25, Sem 7 is 24.
      const yearPrefix = 27 - Math.floor(semNumber / 2);

      for (let s = 1; s <= 5; s++) {
        // Format roll number: e.g., 27CSE001
        const rollNumberStr = `${yearPrefix}${dept.code}${rollCounter.toString().padStart(3, '0')}`;
        rollCounter++;

        // Assign residentStatus randomly
        const r = Math.random();
        let residentStatus: "HOSTELER" | "DAYSCHOLAR_BUS" | "DAYSCHOLAR_NORMAL" = "DAYSCHOLAR_NORMAL";
        if (r < 0.3) residentStatus = "HOSTELER";
        else if (r < 0.6) residentStatus = "DAYSCHOLAR_BUS";

        const [student] = await db.insert(users).values({
          name: `${dept.code} Student ${rollNumberStr}`,
          email: `${rollNumberStr.toLowerCase()}@test.com`,
          password: hashedPassword,
          role: "STUDENT",
          departmentId: dbDept.id,
          semester: semNumber,
          rollNumber: rollNumberStr,
          residentStatus,
        }).returning();

        // Create Payments based on residentStatus
        await db.insert(payments).values({
          userId: student.id,
          amount: 50000,
          status: "COMPLETED",
          feeType: "TUITION",
        });

        if (residentStatus === "HOSTELER") {
          await db.insert(payments).values({
            userId: student.id,
            amount: 30000,
            status: Math.random() > 0.5 ? "COMPLETED" : "PENDING",
            feeType: "HOSTEL",
          });
        } else if (residentStatus === "DAYSCHOLAR_BUS") {
          await db.insert(payments).values({
            userId: student.id,
            amount: 15000,
            status: Math.random() > 0.5 ? "COMPLETED" : "PENDING",
            feeType: "BUS",
          });
        }

        // Enroll Student in all courses for their semester
        for (const course of coursesForThisSem) {
          await db.insert(enrollments).values({
            studentId: student.id,
            courseId: course.id,
            status: "ACTIVE",
          });

          // Generate Result for this course
          // The user requested 40 as pass mark. Let's make 90% of students pass.
          const isPass = Math.random() > 0.1; 
          let marks = 0;
          if (isPass) {
             marks = Math.floor(Math.random() * 60) + 40; // 40 to 100
          } else {
             marks = Math.floor(Math.random() * 39); // 0 to 39
          }

          let grade = "F";
          if (marks >= 90) grade = "A+";
          else if (marks >= 80) grade = "A";
          else if (marks >= 70) grade = "B";
          else if (marks >= 60) grade = "C";
          else if (marks >= 50) grade = "D";
          else if (marks >= 40) grade = "E";

          await db.insert(results).values({
            userId: student.id,
            courseId: course.id,
            marks,
            grade,
          });
        }
      }
    }
  }

  console.log("✅ Seeding Complete!");
  console.log("-----------------------------------------");
  console.log("Login Credentials:");
  console.log("Admin: admin@test.com / 123456");
  console.log("Faculty: csefaculty1@test.com to csefaculty16@test.com / 123456");
  console.log("         (Same format applies to ECE and CE)");
  console.log("Students: 27cse001@test.com to 27cse005@test.com (Sem 1) / 123456");
  console.log("          26cse001@test.com to 26cse005@test.com (Sem 3) / 123456");
  console.log("          (Same format applies to ECE and CE for sems 1, 3, 5, 7)");
  console.log("-----------------------------------------");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
