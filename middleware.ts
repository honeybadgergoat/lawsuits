import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/new-case", "/cases", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get("firebaseToken")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/new-case/:path*", "/cases/:path*", "/admin/:path*"]
};
