import "dotenv/config";
import { db } from "../src/db/index";
import { courses, users, departments } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const student = await db.query.users.findFirst({
      where: eq(users.email, "24cse001@test.com")
    });
    console.log("Student:", {
      id: student?.id,
      email: student?.email,
      departmentId: student?.departmentId,
      semester: student?.semester
    });

    const studentDept = student?.departmentId 
      ? await db.query.departments.findFirst({ where: eq(departments.id, student.departmentId) })
      : null;
    console.log("Student Dept:", studentDept);

    const allCourses = await db.select().from(courses);
    for (const c of allCourses) {
      const dept = c.categoryId 
        ? await db.query.departments.findFirst({ where: eq(departments.id, c.categoryId) })
        : null;
      console.log(`Course: "${c.title}" | Sem: ${c.semester} | DeptId: ${c.categoryId} (${dept?.name})`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
