import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const data = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        receiptUrl: payments.receiptUrl,
        feeType: payments.feeType,
        date: payments.date,
        studentName: users.name,
        studentRollNumber: users.rollNumber,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.date));

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
    const { paymentId, status, receiptUrl } = body;

    if (!paymentId) return errorResponse("Payment ID is required", 400);

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
