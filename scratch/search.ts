import "dotenv/config";
import { db } from "../src/db/index";
import { users, departments } from "../src/db/schema";
import { loadEnvConfig } from "@next/env";
import { eq, sql } from "drizzle-orm";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function run() {
  try {
    const allUsers = await db.select().from(users);
    console.log(`Total users in database: ${allUsers.length}`);
    
    const roleCounts: Record<string, number> = {};
    allUsers.forEach(u => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });
    console.log("Roles breakdown:", JSON.stringify(roleCounts, null, 2));

    const depts = await db.select().from(departments);
    const deptMap: Record<string, string> = {};
    depts.forEach(d => {
      deptMap[d.id] = d.name;
    });

    const studentDeptCounts: Record<string, number> = {};
    allUsers.filter(u => u.role === "STUDENT").forEach(u => {
      const deptName = u.departmentId ? (deptMap[u.departmentId] || u.departmentId) : "No Department";
      studentDeptCounts[deptName] = (studentDeptCounts[deptName] || 0) + 1;
    });
    console.log("Student count by Department:", JSON.stringify(studentDeptCounts, null, 2));

  } catch (e) {
    console.error("Error querying users:", e);
  } finally {
    process.exit(0);
  }
}

run();
