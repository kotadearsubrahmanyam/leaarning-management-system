export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("token");
  return successResponse(null, "Logged out successfully");
}
