import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getVal(row: any, keys: string[]): string {
  for (const k of Object.keys(row)) {
    const cleanK = k.toLowerCase().replace(/[\s_-]/g, "");
    for (const target of keys) {
      if (cleanK === target) {
        return String(row[k] ?? "").trim();
      }
    }
  }
  return "";
}

const NAME_KEYS = ["name", "fullname", "username", "studentname", "teachername"];
const ROLL_KEYS = ["rollnumber", "roll", "rollno", "facultyid", "faculty", "id", "username"];
const EMAIL_KEYS = ["email", "emailaddress", "mail"];
const DEPT_KEYS = ["department", "dept", "branch"];
const SEM_KEYS = ["semester", "sem"];
const SUB_KEYS = ["subject", "course", "subjectname"];

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { roleType, rows } = body;

    if (!roleType || !Array.isArray(rows)) {
      return errorResponse("Invalid request body. 'roleType' and 'rows' are required.", 400);
    }

    if (rows.length > 5000) {
      return errorResponse("Maximum of 5000 records allowed per upload.", 400);
    }

    // Load all departments to resolve name -> ID
    const dbDepts = await db.select().from(departments);
    const deptMap = new Map<string, string>(); // lowercase name/code -> ID
    const deptNameMap = new Map<string, string>(); // ID -> actual name

    dbDepts.forEach((d) => {
      const nameLower = d.name.toLowerCase();
      deptMap.set(nameLower, d.id);
      deptNameMap.set(d.id, d.name);

      if (d.description) {
        const firstWord = d.description.split(" ")[0].toLowerCase();
        deptMap.set(firstWord, d.id);
      }
      
      // Manual/Standard abbreviations
      if (nameLower.includes("computer science")) {
        deptMap.set("cse", d.id);
        deptMap.set("computer science and engineering", d.id);
      }
      if (nameLower.includes("electronics")) {
        deptMap.set("ece", d.id);
        deptMap.set("electronics and communication engineering", d.id);
      }
      if (nameLower.includes("business")) {
        deptMap.set("bba", d.id);
        deptMap.set("bachelor of business administration", d.id);
      }
    });

    // We will extract values, then check DB for existing emails and roll numbers
    const processedRows = rows.map((row, idx) => {
      const name = getVal(row, NAME_KEYS);
      const rollNumber = getVal(row, ROLL_KEYS);
      const email = getVal(row, EMAIL_KEYS);
      const deptStr = getVal(row, DEPT_KEYS);
      const semesterStr = getVal(row, SEM_KEYS);
      const subject = getVal(row, SUB_KEYS);

      return {
        originalIndex: idx + 1,
        name,
        rollNumber,
        email,
        deptStr,
        semesterStr,
        subject,
      };
    });

    // Collect all emails and roll numbers to query DB in batches
    const emailsToQuery = processedRows.map(r => r.email.toLowerCase()).filter(Boolean);
    const rollsToQuery = processedRows.map(r => r.rollNumber.toLowerCase()).filter(Boolean);

    const dbEmails = new Set<string>();
    const dbRolls = new Set<string>();

    if (emailsToQuery.length > 0) {
      // Drizzle chunking query to avoid SQL parameters overflow
      const chunkSize = 100;
      for (let i = 0; i < emailsToQuery.length; i += chunkSize) {
        const chunk = emailsToQuery.slice(i, i + chunkSize);
        const usersMatch = await db
          .select({ email: users.email })
          .from(users)
          .where(inArray(users.email, chunk));
        usersMatch.forEach(u => dbEmails.add(u.email.toLowerCase()));
      }
    }

    if (rollsToQuery.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < rollsToQuery.length; i += chunkSize) {
        const chunk = rollsToQuery.slice(i, i + chunkSize);
        const usersMatch = await db
          .select({ rollNumber: users.rollNumber })
          .from(users)
          .where(inArray(users.rollNumber, chunk));
        usersMatch.forEach(u => {
          if (u.rollNumber) {
            dbRolls.add(u.rollNumber.toLowerCase());
          }
        });
      }
    }

    // Keep track of duplicates in the uploaded sheet
    const sheetEmails = new Set<string>();
    const sheetRolls = new Set<string>();
    
    let validCount = 0;
    let invalidCount = 0;

    const validationResults = processedRows.map((r) => {
      const rowErrors: string[] = [];

      // Name check
      if (!r.name) {
        rowErrors.push("Empty Name");
      }

      // Email check
      if (!r.email) {
        rowErrors.push("Empty Email");
      } else {
        const emailLower = r.email.toLowerCase();
        // Regex validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
          rowErrors.push("Invalid Email Format");
        } else if (dbEmails.has(emailLower)) {
          rowErrors.push("Duplicate Email (Already exists in database)");
        } else if (sheetEmails.has(emailLower)) {
          rowErrors.push("Duplicate Email (Repeated in upload file)");
        } else {
          sheetEmails.add(emailLower);
        }
      }

      // Roll Number / Faculty ID check
      const identifierName = roleType === "STUDENT" ? "Roll Number" : "Faculty ID";
      if (!r.rollNumber) {
        rowErrors.push(`Empty ${identifierName}`);
      } else {
        const rollLower = r.rollNumber.toLowerCase();
        if (dbRolls.has(rollLower)) {
          rowErrors.push(`Duplicate ${identifierName} (Already exists in database)`);
        } else if (sheetRolls.has(rollLower)) {
          rowErrors.push(`Duplicate ${identifierName} (Repeated in upload file)`);
        } else {
          sheetRolls.add(rollLower);
        }
      }

      // Department check
      let departmentId = "";
      let resolvedDeptName = "";
      if (!r.deptStr) {
        rowErrors.push("Empty Department");
      } else {
        const dId = deptMap.get(r.deptStr.toLowerCase());
        if (!dId) {
          rowErrors.push(`Invalid Department: "${r.deptStr}"`);
        } else {
          departmentId = dId;
          resolvedDeptName = deptNameMap.get(dId) || r.deptStr;
        }
      }

      // Semester check (STUDENT only)
      let semester: number | null = null;
      if (roleType === "STUDENT") {
        if (!r.semesterStr) {
          rowErrors.push("Empty Semester");
        } else {
          const semNum = parseInt(r.semesterStr, 10);
          if (isNaN(semNum) || semNum < 1 || semNum > 8) {
            rowErrors.push(`Invalid Semester: "${r.semesterStr}" (Must be 1-8)`);
          } else {
            semester = semNum;
          }
        }
      }

      // Subject check (TEACHER only)
      if (roleType === "TEACHER" && !r.subject) {
        rowErrors.push("Empty Subject");
      }

      const isValid = rowErrors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      return {
        rowNumber: r.originalIndex,
        name: r.name || "N/A",
        email: r.email || "N/A",
        rollNumber: r.rollNumber || "N/A",
        department: resolvedDeptName || r.deptStr || "N/A",
        departmentId,
        semester: semester,
        subject: r.subject || "N/A",
        status: isValid ? "valid" : "invalid",
        errors: rowErrors,
      };
    });

    return successResponse({
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
      records: validationResults,
    }, "File validated successfully");

  } catch (error: any) {
    console.error("Bulk validation error:", error);
    return errorResponse("Internal server error", 500);
  }
}
