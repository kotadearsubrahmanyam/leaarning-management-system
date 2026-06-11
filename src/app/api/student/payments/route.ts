import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, feeStructure, users, departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, desc } from "drizzle-orm";

async function ensureDefaultFeesExist(userId: string, semester: number) {
  const existingFees = await db
    .select()
    .from(feeStructure)
    .where(and(eq(feeStructure.userId, userId), eq(feeStructure.semester, semester)));

  if (existingFees.length === 0) {
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));

    const defaultFees = [
      { feeType: "TUITION", amount: 50000, dueDate: new Date("2026-05-15") },
      { feeType: "BUS", amount: 15000, dueDate: new Date("2026-06-20") },
      { feeType: "HOSTEL", amount: 0, dueDate: new Date("2026-06-20") },
      { feeType: "EXAM", amount: 2000, dueDate: new Date("2026-06-25") },
      { feeType: "PLACEMENT", amount: 5000, dueDate: new Date("2026-06-30") }
    ];

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
  }
}

// GET payments and fee structures for student
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;

    // Fetch student's department to get their total semesters
    const [user] = await db
      .select({
        id: users.id,
        departmentId: users.departmentId,
      })
      .from(users)
      .where(eq(users.id, userId));

    let totalSemesters = 8;
    if (user && user.departmentId) {
      const [dept] = await db
        .select({
          totalSemesters: departments.totalSemesters,
        })
        .from(departments)
        .where(eq(departments.id, user.departmentId));
      if (dept) {
        totalSemesters = dept.totalSemesters;
      }
    }

    // Seed default fees for all semesters so student gets complete billing profiles
    for (let sem = 1; sem <= totalSemesters; sem++) {
      await ensureDefaultFeesExist(userId, sem);
    }

    // Fetch payments
    const dbPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.date));

    // Fetch fee structures
    const dbFees = await db
      .select()
      .from(feeStructure)
      .where(eq(feeStructure.userId, userId))
      .orderBy(desc(feeStructure.semester), desc(feeStructure.createdAt));

    // Update overdue status on-the-fly based on current time
    const now = new Date();
    const checkedFees = dbFees.map((fee) => {
      const due = new Date(fee.dueDate);
      if (fee.status === "PENDING" && now > due && fee.paidAmount < fee.amount) {
        fee.status = "OVERDUE";
      }
      return fee;
    });

    return successResponse({
      payments: dbPayments,
      fees: checkedFees,
      totalSemesters: totalSemesters,
    }, "Fetched payments successfully");
  } catch (error) {
    console.error("Fetch payments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST make a payment on a specific fee category
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;
    const body = await req.json();
    const { amount, feeStructureId } = body;

    if (amount === undefined || !feeStructureId) {
      return errorResponse("Missing amount or feeStructureId", 400);
    }

    const payAmount = parseInt(amount);

    // Fetch the target FeeStructure item
    const feeItem = await db.query.feeStructure.findFirst({
      where: and(
        eq(feeStructure.id, feeStructureId),
        eq(feeStructure.userId, userId)
      ),
    });

    if (!feeItem) {
      return errorResponse("Fee structure item not found", 404);
    }

    // Overpayment Blocker Logic
    const lateFeeToApply = feeItem.isLateFeeExempt ? 0 : feeItem.lateFee;
    const totalDue = feeItem.amount + lateFeeToApply - feeItem.discountAmount - feeItem.paidAmount;
    
    if (payAmount > totalDue) {
       return errorResponse(`Payment exceeds due amount. Maximum payable amount is ₹${totalDue}`, 400);
    }

    // Insert a new Payment transaction
    const [newPayment] = await db.insert(payments).values({
      userId,
      amount: payAmount,
      status: "PAID",
      feeType: feeItem.feeType as any, // Cast fee type
      feeStructureId,
      date: new Date(),
    }).returning();

    // Calculate new paid amount and status for the fee item
    const newPaidAmount = feeItem.paidAmount + payAmount;
    let newStatus = "PENDING";
    
    if (newPaidAmount >= (feeItem.amount + lateFeeToApply - feeItem.discountAmount)) {
      newStatus = "PAID";
    } else {
      const now = new Date();
      const due = new Date(feeItem.dueDate);
      newStatus = now > due ? "OVERDUE" : "PENDING";
    }

    // Update the FeeStructure record
    const [updatedFee] = await db.update(feeStructure)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(feeStructure.id, feeStructureId))
      .returning();

    return successResponse({
      payment: newPayment,
      fee: updatedFee,
    }, "Payment successful");
  } catch (error) {
    console.error("Record payment error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT endpoint to update payment status
export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) return errorResponse("Missing paymentId", 400);

    const existingPayment = await db.query.payments.findFirst({
      where: and(
        eq(payments.id, paymentId),
        eq(payments.userId, payload.id as string)
      ),
    });

    if (!existingPayment) {
      return errorResponse("Payment not found", 404);
    }

    const [updated] = await db.update(payments)
      .set({ status: "PAID", date: new Date() })
      .where(eq(payments.id, paymentId))
      .returning();

    // If the payment is associated with a fee structure, update it as well
    if (updated.feeStructureId) {
      const feeItem = await db.query.feeStructure.findFirst({
        where: eq(feeStructure.id, updated.feeStructureId),
      });

      if (feeItem) {
        const newPaidAmount = feeItem.paidAmount + updated.amount;
        let newStatus = "PENDING";
        if (newPaidAmount >= feeItem.amount) {
          newStatus = "PAID";
        } else {
          const now = new Date();
          const due = new Date(feeItem.dueDate);
          newStatus = now > due ? "OVERDUE" : "PENDING";
        }

        await db.update(feeStructure)
          .set({
            paidAmount: newPaidAmount,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(feeStructure.id, updated.feeStructureId));
      }
    }

    return successResponse({ payment: updated }, "Payment verified/updated successfully");
  } catch (error) {
    console.error("Update payment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
