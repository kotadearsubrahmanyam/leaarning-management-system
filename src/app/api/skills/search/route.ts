export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { errorResponse } from "@/lib/api-response";

const SPRING_BOOT_API_BASE_URL = process.env.SPRING_BOOT_API_URL || "http://127.0.0.1:8082";
const SPRING_BOOT_API_URL = `${SPRING_BOOT_API_BASE_URL}/api/skills/search`;

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";

    const response = await fetch(`${SPRING_BOOT_API_URL}?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`, {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const skills = await response.json();
    return NextResponse.json(skills);
  } catch (error: any) {
    console.error("GET skills search proxy error:", error);
    return NextResponse.json([]);
  }
}
