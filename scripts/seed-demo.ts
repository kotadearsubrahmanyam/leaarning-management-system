import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

async function main() {
  const { db } = await import("../src/db");
  const { users, courses, enrollments, results, assignments, attendance, classSessions } = await import("../src/db/schema");

  console.log("🌱 Starting demo data seed...");

  // 1. Find a Teacher and a Student
  const allUsers = await db.select().from(users);
  let teacher = allUsers.find(u => u.role === "TEACHER");
  let student = allUsers.find(u => u.role === "STUDENT");

  if (!teacher) {
    console.log("👨‍🏫 No teacher found. Creating default Teacher account (teacher@demo.com)...");
    const defaultPassword = await bcrypt.hash("password123", 10);
    const [newTeacher] = await db.insert(users).values({
      name: "Professor Demo",
      email: "teacher@demo.com",
      password: defaultPassword,
      role: "TEACHER"
    }).returning();
    teacher = newTeacher;
  }

  if (!student) {
    console.error("❌ No student found. Please create a student account first.");
    process.exit(1);
  }

  console.log(`✅ Using Student: ${student.name} (${student.email})`);

  // 2. Define the 6 Subjects
  const subjects = [
    { title: "Data Structures & Algorithms", level: "Advanced", grade: "A+", marks: 98 },
    { title: "Operating Systems", level: "Intermediate", grade: "B+", marks: 78 },
    { title: "Machine Learning Foundations", level: "Advanced", grade: "A", marks: 92 },
    { title: "Computer Networks", level: "Intermediate", grade: "A", marks: 88 },
    { title: "Database Management Systems", level: "Intermediate", grade: "B", marks: 74 },
    { title: "Software Engineering Principles", level: "Beginner", grade: "A+", marks: 95 },
  ];

  const courseIds: string[] = [];

  for (const sub of subjects) {
    // Create Course
    const [course] = await db.insert(courses).values({
      title: sub.title,
      description: `Comprehensive study of ${sub.title}.`,
      level: sub.level,
      teacherId: teacher.id,
    }).returning();
    courseIds.push(course.id);

    // Enroll Student
    await db.insert(enrollments).values({
      studentId: student.id,
      courseId: course.id,
      status: "ACTIVE",
    });

    // Add Result
    await db.insert(results).values({
      userId: student.id,
      courseId: course.id,
      semester: student.semester || 1,
      studentName: student.name,
      studentRollNumber: student.rollNumber,
      subjectCode: course.id.substring(0, 6).toUpperCase(),
      subjectName: course.title,
      marks: sub.marks,
      grade: sub.grade,
      status: sub.marks >= 40 ? "PASS" : "FAIL",
      published: true,
      credits: course.credits || 3,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // Add 2 Assignments per course
    await db.insert(assignments).values([
      {
        courseId: course.id,
        title: `Midterm Project: ${sub.title}`,
        description: `Implement the core concepts discussed in the first half of the ${sub.title} course. Ensure your code is well-documented.`,
        dueDate: new Date(Date.now() + 86400000 * Math.floor(Math.random() * 14 + 1)), // 1 to 14 days from now
      },
      {
        courseId: course.id,
        title: `Weekly Quiz: ${sub.title}`,
        description: `Complete the multiple choice quiz covering this week's topics.`,
        dueDate: new Date(Date.now() + 86400000 * Math.floor(Math.random() * 5 + 1)), // 1 to 5 days from now
      }
    ]);

    // Add a classSession for the attendance
    const [session] = await db.insert(classSessions).values({
      courseId: course.id,
      facultyId: teacher.id,
      sectionId: "A",
      date: new Date(),
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      sessionType: "LECTURE",
    }).returning();

    // Add some random attendance records (Past 5 days)
    for (let i = 1; i <= 5; i++) {
      const statusRoll = Math.random();
      const status = statusRoll > 0.8 ? "ABSENT" : statusRoll > 0.6 ? "LATE" : "PRESENT";
      await db.insert(attendance).values({
        studentId: student.id,
        sessionId: session.id,
        status: status,
        timestamp: new Date(Date.now() - 86400000 * i),
      });
    }
  }

  console.log(`✅ Successfully seeded 6 real subjects with Results, Assignments, and Attendance!`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
