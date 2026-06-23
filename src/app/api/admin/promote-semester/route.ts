export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, enrollments, waitlists, results, attendance, feeStructure } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, inArray, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { departmentId, fromSemester } = body;

    if (!departmentId || !fromSemester) {
      return errorResponse("Missing departmentId or fromSemester", 400);
    }

    // 1. Get all students in this batch
    const students = await db.select({ 
      id: users.id,
      libraryCleared: users.libraryCleared,
      hostelCleared: users.hostelCleared,
      accountsCleared: users.accountsCleared
    })
      .from(users)
      .where(and(
        eq(users.departmentId, departmentId),
        eq(users.semester, fromSemester),
        eq(users.role, "STUDENT")
      ));

    if (students.length === 0) {
      return errorResponse("No students found in this batch.", 404);
    }

    const studentIds = students.map(s => s.id);
    const inStudentIds = sql`(${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`;

    // 2. Validate all results are declared
    const unpublishedCountRes = await db.execute(sql`
      SELECT COUNT(*) as count FROM "Result" 
      WHERE "userId" IN ${inStudentIds} AND published = false
    `);
    
    const count = parseInt(unpublishedCountRes.rows[0].count as string || "0");
    if (count > 0) {
      return errorResponse(`Cannot promote batch: ${count} unpublished results remaining. Please Declare Results first.`, 400);
    }

    // 3. Find detained students (> 2 backlogs)
    const backlogsRes = await db.execute(sql`
      SELECT "userId", COUNT(*) as backlogs
      FROM "Result"
      WHERE "userId" IN ${inStudentIds} AND status = 'FAIL' AND published = true
      GROUP BY "userId"
      HAVING COUNT(*) > 2
    `);

    const detainedIds = backlogsRes.rows.map(r => r.userId as string);

    // 3b. Attendance Checking (Condonation & Detention)
    const attendanceRecords = await db.select({
       userId: attendance.studentId,
       status: attendance.status
    })
    .from(attendance)
    .where(inArray(attendance.studentId, studentIds));

    const studentAttendance = new Map();
    for (const id of studentIds) {
       studentAttendance.set(id, { total: 0, present: 0 });
    }
    
    for (const rec of attendanceRecords) {
       const stat = studentAttendance.get(rec.userId);
       if (stat) {
          stat.total++;
          if (rec.status === 'PRESENT') stat.present++;
       }
    }

    const attendanceDetainedIds: string[] = [];
    const condonationIds: string[] = [];

    for (const [id, stat] of Array.from(studentAttendance.entries())) {
       if (stat.total > 0) {
          const percentage = (stat.present / stat.total) * 100;
          if (percentage < 65) {
             attendanceDetainedIds.push(id);
             if (!detainedIds.includes(id)) detainedIds.push(id);
          } else if (percentage >= 65 && percentage < 75) {
             condonationIds.push(id);
          }
       }
    }

    // Generate Condonation Fees
    if (condonationIds.length > 0) {
       for (const cid of condonationIds) {
          const existingFee = await db.select().from(feeStructure)
             .where(and(eq(feeStructure.userId, cid), eq(feeStructure.semester, fromSemester), eq(feeStructure.feeType, "CONDONATION")));
          
          if (existingFee.length === 0) {
             await db.insert(feeStructure).values({
                userId: cid,
                feeType: "CONDONATION",
                amount: 1000,
                dueDate: new Date(),
                semester: fromSemester,
                status: "PENDING"
             });
          }
       }
    }
    
    const duesDetainedIds: string[] = [];
    if (fromSemester == 8) {
      for (const s of students) {
        if (!s.libraryCleared || !s.hostelCleared || !s.accountsCleared) {
           duesDetainedIds.push(s.id);
        }
      }
    }

    const promotedIds = studentIds.filter(id => !detainedIds.includes(id) && !duesDetainedIds.includes(id));

    // 4. Update Enrollments to COMPLETED and Delete Waitlists for ALL students in the batch (they finished the semester)
    await db.execute(sql`
      UPDATE "Enrollment" SET status = 'COMPLETED' 
      WHERE "studentId" IN ${inStudentIds} AND status = 'ACTIVE'
    `);
    
    await db.execute(sql`
      DELETE FROM "Waitlist" WHERE "studentId" IN ${inStudentIds}
    `);

    // 5. Update Semester for Promoted Students
    if (promotedIds.length > 0) {
      const inPromotedIds = sql`(${sql.join(promotedIds.map(id => sql`${id}`), sql`, `)})`;

      if (fromSemester == 8) {
        // Graduate them
        await db.execute(sql`
          UPDATE "User" SET role = 'ALUMNI' WHERE id IN ${inPromotedIds}
        `);
      } else {
        // Promote them
        await db.execute(sql`
          UPDATE "User" SET semester = semester + 1 WHERE id IN ${inPromotedIds}
        `);
      }
    }

    // Detained students remain in `fromSemester`.

    return successResponse({
      promoted: promotedIds.length,
      detained: detainedIds.length,
      duesDetained: duesDetainedIds.length,
      condonationApplied: condonationIds.length,
      graduated: fromSemester == 8 ? promotedIds.length : 0
    }, "Batch successfully processed!", 200);

  } catch (error) {
    console.error("Promote Semester Error", error);
    return errorResponse("Internal error", 500);
  }
}
