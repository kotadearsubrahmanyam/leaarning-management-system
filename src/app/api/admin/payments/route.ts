export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, feeStructure } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const rawData = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        receiptUrl: payments.receiptUrl,
        feeType: payments.feeType,
        feeStructureType: feeStructure.feeType,
        date: payments.date,
        studentName: users.name,
        studentRollNumber: users.rollNumber,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(feeStructure, eq(payments.feeStructureId, feeStructure.id))
      .orderBy(desc(payments.date));

    const data = rawData.map(item => ({
      id: item.id,
      amount: item.amount,
      status: item.status,
      receiptUrl: item.receiptUrl,
      feeType: item.feeStructureType || item.feeType,
      date: item.date,
      studentName: item.studentName,
      studentRollNumber: item.studentRollNumber,
    }));

    return successResponse({ payments: data }, "Fetched all payments successfully");
  } catch (error) {
    console.error("Fetch all payments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { paymentId, paymentIds, status, receiptUrl } = body;

    if (!paymentId && (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0)) {
      return errorResponse("Payment ID or Payment IDs are required", 400);
    }

    if (paymentIds && Array.isArray(paymentIds)) {
      const updatedPayments = await db.update(payments)
        .set({ status: status || "VERIFIED", receiptUrl: receiptUrl || null })
        .where(inArray(payments.id, paymentIds))
        .returning();

      return successResponse({ payments: updatedPayments }, `${updatedPayments.length} payments verified successfully`);
    }

    const [updatedPayment] = await db.update(payments)
      .set({ status: status || "VERIFIED", receiptUrl: receiptUrl || null })
      .where(eq(payments.id, paymentId))
      .returning();

    return successResponse({ payment: updatedPayment }, "Payment updated successfully");
  } catch (error) {
    console.error("Update payment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
