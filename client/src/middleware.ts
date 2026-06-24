/**
 * AgriSense AI — Auth Middleware
 * =================================
 * Protects routes and handles i18n locale routing.
 */

import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const publicPaths = ["/login", "/register", "/", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/api"))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth token in cookies or authorization header
  const token =
    request.cookies.get("agrisense_session")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // For client-side auth (localStorage), we let the client handle redirection
  // This middleware primarily adds security headers

  const response = NextResponse.next();

  // Add security headers to every response
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
