import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

const SPRING_BOOT_API_BASE_URL = process.env.SPRING_BOOT_API_URL || "http://127.0.0.1:8082";
const SPRING_BOOT_API_URL = `${SPRING_BOOT_API_BASE_URL}/api/resumes`;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("export"); // "pdf" or "tex"

    if (exportType === "pdf") {
      const response = await fetch(`${SPRING_BOOT_API_URL}/${params.id}/pdf`, {
        method: "GET",
        headers: {
          "X-User-Id": payload.id,
        },
      });

      if (!response.ok) {
        return errorResponse("Failed to export PDF from backend", response.status);
      }

      const pdfBuffer = await response.arrayBuffer();
      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=resume.pdf",
        },
      });
    }

    if (exportType === "tex") {
      const response = await fetch(`${SPRING_BOOT_API_URL}/${params.id}/tex`, {
        method: "GET",
        headers: {
          "X-User-Id": payload.id,
        },
      });

      if (!response.ok) {
        return errorResponse("Failed to export LaTeX from backend", response.status);
      }

      const texBuffer = await response.arrayBuffer();
      return new Response(texBuffer, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=resume.tex",
        },
      });
    }

    // Default: Return resume JSON object
    const response = await fetch(`${SPRING_BOOT_API_URL}/${params.id}`, {
      method: "GET",
      headers: {
        "X-User-Id": payload.id,
      },
    });

    if (!response.ok) {
      return errorResponse("Resume not found", response.status);
    }

    const resume = await response.json();
    return successResponse(resume, "Resume fetched successfully");
  } catch (error: any) {
    console.error("GET resume proxy error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const body = await req.json();

    const response = await fetch(`${SPRING_BOOT_API_URL}/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": payload.id,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(`Failed to update resume: ${errorText}`, response.status);
    }

    const updatedResume = await response.json();
    return successResponse(updatedResume, "Resume updated successfully");
  } catch (error: any) {
    console.error("PUT resume proxy error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return errorResponse("Unauthorized", 401);
    const payload = await verifyJwt(token);
    if (!payload) return errorResponse("Invalid token", 401);

    const response = await fetch(`${SPRING_BOOT_API_URL}/${params.id}`, {
      method: "DELETE",
      headers: {
        "X-User-Id": payload.id,
      },
    });

    if (!response.ok) {
      return errorResponse("Failed to delete resume", response.status);
    }

    return successResponse(null, "Resume deleted successfully");
  } catch (error: any) {
    console.error("DELETE resume proxy error:", error);
    return errorResponse("Internal server error", 500);
  }
}
