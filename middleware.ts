import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function applyCourseEmbedHeaders(response: NextResponse, pathname: string) {
  if (!pathname.startsWith("/courses")) return response;

  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "unsafe-none");
  response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return response;
}

function isComingSoonHost(host: string | null) {
  const normalized = (host ?? "").toLowerCase().split(":")[0];
  return normalized === "kabullearn.com" || normalized === "www.kabullearn.com";
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const role = request.auth?.user?.role;
  const status = request.auth?.user?.status;

  if (pathname === "/" && isComingSoonHost(request.headers.get("host"))) {
    return NextResponse.rewrite(new URL("/coming-soon.html", request.nextUrl));
  }

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
    return applyCourseEmbedHeaders(NextResponse.redirect(verifyUrl), pathname);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/educator")) {
    if (!role) {
      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
      return applyCourseEmbedHeaders(NextResponse.redirect(loginUrl), pathname);
    }
    // Strict separation: admins → /admin only, educators → /educator only
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return applyCourseEmbedHeaders(NextResponse.redirect(new URL("/dashboard", request.nextUrl)), pathname);
    }
    if (pathname.startsWith("/educator") && role !== "EDUCATOR") {
      return applyCourseEmbedHeaders(NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/dashboard", request.nextUrl)), pathname);
    }
  }

  return applyCourseEmbedHeaders(NextResponse.next(), pathname);
});

export const config = {
  matcher: ["/", "/admin/:path*", "/educator/:path*", "/dashboard/:path*", "/courses/:path*", "/api/enroll", "/api/promo/:path*", "/api/educator/:path*"]
};
