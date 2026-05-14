import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/jwt";

// Define which routes require authentication and what roles they allow
const routeRoles: Record<string, string[]> = {
  "/api/admin": ["ADMIN"],
  "/api/teacher": ["ADMIN", "TEACHER"],
  "/api/student": ["ADMIN", "TEACHER", "STUDENT"],
  "/dashboard": ["ADMIN", "TEACHER", "STUDENT"],
  // Add more protected routes here
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Find if the current path matches any protected route
  const protectedRoute = Object.keys(routeRoles).find((route) => path.startsWith(route));

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check RBAC
  const allowedRoles = routeRoles[protectedRoute];
  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Pass user details to headers for downstream use if needed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-user-email", payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
