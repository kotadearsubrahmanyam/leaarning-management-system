import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const data = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, payload.id as string))
      .orderBy(desc(payments.createdAt));

    return successResponse({ payments: data }, "Fetched payments successfully");
  } catch (error) {
    console.error("Fetch payments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "STUDENT") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { amount, feeType = "TUITION" } = body;

    const [payment] = await db.insert(payments).values({
      userId: payload.id as string,
      amount,
      status: "PAID",
      feeType,
      date: new Date(),
    }).returning();

    return successResponse({ payment }, "Payment recorded successfully");
  } catch (error) {
    console.error("Record payment error:", error);
    return errorResponse("Internal server error", 500);
  }
}

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

    const [updated] = await db.update(payments)
      .set({ status: "PAID", date: new Date() })
      .where(eq(payments.id, paymentId))
      .returning();

    return successResponse({ payment: updated }, "Payment successful");
  } catch (error) {
    console.error("Update payment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
