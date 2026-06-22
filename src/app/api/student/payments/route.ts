import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, feeStructure, users, departments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, and, desc, isNull } from "drizzle-orm";

const mapFeeTypeToPaymentEnum = (feeType: string): "TUITION" | "HOSTEL" | "BUS" | "SUPPLEMENTARY" | "CONDONATION" | "OTHER" => {
  const allowed = ["TUITION", "HOSTEL", "BUS", "SUPPLEMENTARY", "CONDONATION"];
  return allowed.includes(feeType) ? (feeType as any) : "OTHER";
};

async function ensureDefaultFeesExist(userId: string, semester: number, currentSemester: number) {
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
    for (const f of defaultFees) {
      // Past and current semesters are already paid/cleared. Future semesters are pending.
      const isPaidSemester = semester <= currentSemester;
      const paid = isPaidSemester ? f.amount : 0;
      const status = isPaidSemester ? "PAID" : "PENDING";

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

      // If it's a paid semester and it has an amount, insert a corresponding payment record to populate the ledger
      if (isPaidSemester && f.amount > 0) {
        await db.insert(payments).values({
          userId,
          amount: f.amount,
          status: "VERIFIED",
          feeType: mapFeeTypeToPaymentEnum(f.feeType),
          feeStructureId: inserted.id,
          date: new Date(new Date().getFullYear() - (currentSemester - semester), 5, 15),
        });
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

// GET payments and fee structures for student
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const userId = payload.id as string;

    // Fetch student's department to get their total semesters and active semester
    const [user] = await db
      .select({
        id: users.id,
        departmentId: users.departmentId,
        semester: users.semester,
      })
      .from(users)
      .where(eq(users.id, userId));

    const currentSemester = user?.semester || 1;

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

    // Clean existing feeStructure and payments to allow clean re-seeding according to student's current active semester
    // Note: In a real system we would keep actual student transactions, but for development reset we wipe and re-seed
    const existingFees = await db
      .select()
      .from(feeStructure)
      .where(eq(feeStructure.userId, userId));

    // If student active semester changed or first time seeding, recreate to align correctly
    if (existingFees.length > 0) {
      const dbSemesters = Array.from(new Set(existingFees.map(f => f.semester)));
      const minSem = Math.min(...dbSemesters);
      const maxSem = Math.max(...dbSemesters);
      
      // If the seeded structure doesn't match totalSemesters or has incorrect payments for future semesters
      const hasIncorrectSeeding = existingFees.some(f => 
        (f.semester > currentSemester && f.status === "PAID" && f.amount > 0)
      );

      if (hasIncorrectSeeding || dbSemesters.length !== totalSemesters) {
        await db.delete(payments).where(eq(payments.userId, userId));
        await db.delete(feeStructure).where(eq(feeStructure.userId, userId));
      }
    }

    // Seed default fees for all semesters so student gets complete billing profiles
    for (let sem = 1; sem <= totalSemesters; sem++) {
      await ensureDefaultFeesExist(userId, sem, currentSemester);
    }

    // Fetch payments
    const dbPaymentsRaw = await db
      .select({
        payment: payments,
        fee: feeStructure,
      })
      .from(payments)
      .leftJoin(feeStructure, eq(payments.feeStructureId, feeStructure.id))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.date));

    const dbPayments = dbPaymentsRaw.map(row => ({
      ...row.payment,
      feeType: row.fee?.feeType || row.payment.feeType,
    }));

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
    if (isNaN(payAmount) || payAmount <= 0) {
      return errorResponse("Invalid payment amount. Amount must be greater than zero.", 400);
    }

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

    // Block payments for future semesters
    const [studentUser] = await db
      .select({ semester: users.semester })
      .from(users)
      .where(eq(users.id, userId));

    const currentActiveSemester = studentUser?.semester || 1;
    if (feeItem.semester > currentActiveSemester) {
      return errorResponse(`You cannot pay fees for future semesters (Semester ${feeItem.semester}). This section is for informational purposes only.`, 400);
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
      feeType: mapFeeTypeToPaymentEnum(feeItem.feeType),
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
    
    if (existingPayment.status === "PAID") {
      return errorResponse("Payment is already verified and processed.", 400);
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
