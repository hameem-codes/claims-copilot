import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAuthApiRoute = pathname.startsWith("/api/auth");

  // Allow auth API routes to pass through freely
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // If authenticated and trying to go to login/signup -> redirect to main app "/"
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If unauthenticated and trying to access protected routes -> redirect to "/login"
  if (!sessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect routes, excluding static assets and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.json$|.*\\.webp$).*)",
  ],
};
