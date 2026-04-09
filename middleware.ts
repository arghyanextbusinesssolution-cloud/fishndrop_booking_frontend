import { NextRequest, NextResponse } from "next/server";

const authPages = ["/login", "/register", "/admin-login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const hasSession = Boolean(token && role);

  if (authPages.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/user", request.url));
  }

  if ((pathname.startsWith("/user") || pathname.startsWith("/admin")) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  if (pathname.startsWith("/user") && role !== "user") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/register", "/admin-login", "/user/:path*", "/admin/:path*"] };
