export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeStructure, users, departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, desc } from "drizzle-orm";

import { payments } from "@/db/schema";

async function ensureDefaultFeesExist(userId: string, semester: number) {
  const existingFees = await db
    .select()
    .from(feeStructure)
    .where(and(eq(feeStructure.userId, userId), eq(feeStructure.semester, semester)));

  const student = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!student) return;

  const hostelAmount = student.residentStatus === "HOSTELER" ? 30000 : 0;
  const busAmount = student.residentStatus === "DAYSCHOLAR_BUS" ? 15000 : 0;
  const tuitionAmount = student.isFeeReimbursed ? 0 : 50000;

  const defaultFees = [
    { feeType: "TUITION", amount: tuitionAmount, dueDate: new Date("2026-05-15") },
    { feeType: "BUS", amount: busAmount, dueDate: new Date("2026-06-20") },
    { feeType: "HOSTEL", amount: hostelAmount, dueDate: new Date("2026-06-20") },
    { feeType: "EXAM", amount: 2000, dueDate: new Date("2026-06-25") },
    { feeType: "PLACEMENT", amount: 5000, dueDate: new Date("2026-06-30") }
  ];

  if (existingFees.length === 0) {
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));

    for (const f of defaultFees) {
      const matchPayment = userPayments.find(p => p.feeType === f.feeType && (p.status === "PAID" || p.status === "VERIFIED" || p.status === "COMPLETED"));
      const paid = matchPayment ? matchPayment.amount : 0;
      const status = paid >= f.amount ? "PAID" : "PENDING";

      const [inserted] = await db.insert(feeStructure).values({
        userId,
        feeType: f.feeType,
        amount: f.amount,
        paidAmount: paid,
        status,
        dueDate: f.dueDate,
        lateFee: 0,
        semester,
      }).returning();

      if (matchPayment) {
        await db.update(payments)
          .set({ feeStructureId: inserted.id })
          .where(eq(payments.id, matchPayment.id));
      }
    }
  } else {
    // Dynamic Sync: Check if student's status changed (exemption or residency change) and update unpaid fee structures
    for (const f of defaultFees) {
      const match = existingFees.find(ef => ef.feeType === f.feeType);
      if (match) {
        // If it's not fully paid and the amount has changed (e.g. resident status changed or reimbursement enabled/disabled)
        if (match.paidAmount === 0 && match.amount !== f.amount) {
          const now = new Date();
          const due = new Date(match.dueDate);
          let newStatus = match.status;
          if (f.amount === 0) {
            newStatus = "PAID";
          } else {
            newStatus = now > due ? "OVERDUE" : "PENDING";
          }

          await db.update(feeStructure)
            .set({
              amount: f.amount,
              status: newStatus,
            })
            .where(eq(feeStructure.id, match.id));
        }
      }
    }
  }
}

// GET fee structures for a student & semester
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const semester = searchParams.get("semester");

    if (!userId) return errorResponse("userId is required", 400);

    // Fetch student's department to get their total semesters
    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    let totalSemesters = 8;
    if (student && student.departmentId) {
      const [dept] = await db
        .select({
          totalSemesters: departments.totalSemesters,
        })
        .from(departments)
        .where(eq(departments.id, student.departmentId));
      if (dept) {
        totalSemesters = dept.totalSemesters;
      }
    }

    // Seed default fees for all semesters for this student if empty
    for (let sem = 1; sem <= totalSemesters; sem++) {
      await ensureDefaultFeesExist(userId, sem);
    }

    const conditions = [eq(feeStructure.userId, userId)];
    if (semester) {
      conditions.push(eq(feeStructure.semester, parseInt(semester)));
    }

    const data = await db
      .select()
      .from(feeStructure)
      .where(and(...conditions))
      .orderBy(desc(feeStructure.createdAt));

    // Update overdue status on-the-fly if current date exceeds due date and paidAmount < amount
    const now = new Date();
    const checkedData = data.map((item) => {
      const due = new Date(item.dueDate);
      if (item.status === "PENDING" && now > due && item.paidAmount < item.amount) {
        item.status = "OVERDUE";
      }
      return item;
    });

    return successResponse({ fees: checkedData }, "Fetched fees successfully");
  } catch (error) {
    console.error("Fetch fees error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST create a fee structure record
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { userId, feeType, amount, dueDate, semester, lateFee = 0 } = body;

    if (!userId || !feeType || amount === undefined || !dueDate || semester === undefined) {
      return errorResponse("Missing required fields", 400);
    }

    const amt = parseInt(amount);
    const sem = parseInt(semester);
    const lf = parseInt(lateFee);
    const due = new Date(dueDate);

    // Verify student exists
    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!student) {
      return errorResponse("Student user not found", 404);
    }

    const [newFee] = await db.insert(feeStructure).values({
      userId,
      feeType,
      amount: amt,
      paidAmount: 0,
      dueDate: due,
      lateFee: lf,
      semester: sem,
      status: "PENDING",
    }).returning();

    return successResponse({ fee: newFee }, "Fee structure created successfully");
  } catch (error) {
    console.error("Create fee structure error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT update an existing fee structure record
export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { id, amount, dueDate, lateFee, paidAmount, status } = body;

    if (!id) return errorResponse("ID is required", 400);

    const existing = await db.query.feeStructure.findFirst({
      where: eq(feeStructure.id, id),
    });

    if (!existing) return errorResponse("Fee structure not found", 404);

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseInt(amount);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (lateFee !== undefined) updateData.lateFee = parseInt(lateFee);
    if (paidAmount !== undefined) updateData.paidAmount = parseInt(paidAmount);
    
    const currentPaid = paidAmount !== undefined ? parseInt(paidAmount) : existing.paidAmount;
    const currentAmount = amount !== undefined ? parseInt(amount) : existing.amount;

    if (status !== undefined) {
      updateData.status = status;
    } else {
      if (currentPaid >= currentAmount) {
        updateData.status = "PAID";
      } else {
        const now = new Date();
        const due = dueDate !== undefined ? new Date(dueDate) : new Date(existing.dueDate);
        updateData.status = now > due ? "OVERDUE" : "PENDING";
      }
    }

    const [updated] = await db.update(feeStructure)
      .set(updateData)
      .where(eq(feeStructure.id, id))
      .returning();

    return successResponse({ fee: updated }, "Fee structure updated successfully");
  } catch (error) {
    console.error("Update fee structure error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE a fee structure record
export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID is required", 400);

    await db.delete(feeStructure).where(eq(feeStructure.id, id));

    return successResponse(null, "Fee structure deleted successfully");
  } catch (error) {
    console.error("Delete fee structure error:", error);
    return errorResponse("Internal server error", 500);
  }
}
