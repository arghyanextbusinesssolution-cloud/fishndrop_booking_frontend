import { NextRequest, NextResponse } from "next/server";

const authPages = ["/login", "/register", "/admin-login", "/employee-login", "/staff-login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Normalize pathname: remove trailing slash for consistent route checking
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const hasSession = Boolean(token && role);

  const isAuthPage = authPages.includes(cleanPath);

  // If already logged in and visiting auth pages, redirect to role-based dashboard
  if (isAuthPage && hasSession) {
    if (role === "admin" || role === "owner") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "staff") {
      return NextResponse.redirect(new URL("/employee", request.url));
    }
    if (role === "promoter") {
      return NextResponse.redirect(new URL("/promoter", request.url));
    }
    return NextResponse.redirect(new URL("/user", request.url));
  }

  // If unauthenticated guest visiting auth pages, allow access immediately
  if (isAuthPage) {
    return NextResponse.next();
  }

  // Explicit route matchers (prevent "/employee-login" from matching "/employee")
  const isUserRoute = cleanPath === "/user" || cleanPath.startsWith("/user/");
  const isAdminRoute = cleanPath === "/admin" || cleanPath.startsWith("/admin/");
  const isEmployeeRoute = cleanPath === "/employee" || cleanPath.startsWith("/employee/");
  const isProtectedPromoterRoute =
    (cleanPath === "/promoter" || cleanPath.startsWith("/promoter/")) && cleanPath !== "/promoter/register";

  // Require session for protected areas
  if ((isUserRoute || isAdminRoute || isEmployeeRoute || isProtectedPromoterRoute) && !hasSession) {
    if (isEmployeeRoute) {
      return NextResponse.redirect(new URL("/employee-login", request.url));
    }
    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Staff routing: staff must only access /employee routes
  if (isAdminRoute && role === "staff") {
    const subPath = cleanPath.replace(/^\/admin/, "");
    return NextResponse.redirect(new URL("/employee" + (subPath || ""), request.url));
  }
  if (isUserRoute && role === "staff") {
    return NextResponse.redirect(new URL("/employee", request.url));
  }

  // Admin/owner routing
  if (isUserRoute && ["admin", "owner"].includes(role || "")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (isEmployeeRoute && ["admin", "owner"].includes(role || "")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Admin route guard: only admin/owner allowed
  if (isAdminRoute && !["admin", "owner"].includes(role || "")) {
    if (role === "promoter") {
      return NextResponse.redirect(new URL("/promoter", request.url));
    }
    return NextResponse.redirect(new URL("/user", request.url));
  }

  // Employee route guard: only staff allowed
  if (isEmployeeRoute && role !== "staff") {
    if (role === "admin" || role === "owner") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "promoter") {
      return NextResponse.redirect(new URL("/promoter", request.url));
    }
    return NextResponse.redirect(new URL("/user", request.url));
  }

  // Promoter dashboard guard
  if (isProtectedPromoterRoute && !["promoter", "admin", "owner"].includes(role || "")) {
    return NextResponse.redirect(new URL("/partner", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin-login",
    "/employee-login",
    "/staff-login",
    "/user/:path*",
    "/admin/:path*",
    "/employee/:path*",
    "/promoter/:path*"
  ]
};
