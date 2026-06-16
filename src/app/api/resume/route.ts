import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

const SPRING_BOOT_API_URL = "http://localhost:8080/api/resumes";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const response = await fetch(SPRING_BOOT_API_URL, {
      method: "GET",
      headers: {
        "X-User-Id": payload.id,
      },
    });

    if (!response.ok) {
      return errorResponse("Failed to fetch resumes from backend", response.status);
    }

    const resumes = await response.json();
    return successResponse(resumes, "Resumes fetched successfully");
  } catch (error: any) {
    console.error("GET resumes proxy error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const body = await req.json();

    const response = await fetch(SPRING_BOOT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": payload.id,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(`Failed to create resume: ${errorText}`, response.status);
    }

    const newResume = await response.json();
    return successResponse(newResume, "Resume created successfully", 201);
  } catch (error: any) {
    console.error("POST resume proxy error:", error);
    return errorResponse("Internal server error", 500);
  }
}
