import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const role = request.auth?.user?.role;
  const status = request.auth?.user?.status;

  const isProtectedContent =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/educator") ||
    pathname.startsWith("/api/enroll") ||
    pathname.startsWith("/api/educator");

  if (isProtectedContent && status === "VERIFICATION_PENDING") {
    const verifyUrl = new URL("/verify-request", request.nextUrl);
    if (request.auth?.user?.email) {
      verifyUrl.searchParams.set("email", request.auth.user.email);
    }
    return NextResponse.redirect(verifyUrl);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/educator")) {
    if (!role) {
      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    // Strict separation: admins → /admin only, educators → /educator only
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    if (pathname.startsWith("/educator") && role !== "EDUCATOR") {
      return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/dashboard", request.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/educator/:path*", "/dashboard/:path*", "/courses/:path*", "/api/enroll", "/api/educator/:path*"]
};
