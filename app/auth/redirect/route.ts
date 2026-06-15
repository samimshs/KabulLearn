import { type NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth, signOut } from "@/auth";

function requiredRoleForPortal(portal: string | undefined) {
  if (portal === "admin") return UserRole.ADMIN;
  if (portal === "educator") return UserRole.EDUCATOR;
  if (portal === "student") return UserRole.STUDENT;
  return null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  const status = session?.user?.status;

  const { searchParams } = request.nextUrl;
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  const portal = searchParams.get("portal") ?? undefined;

  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";
  const portalRole = requiredRoleForPortal(portal);

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (status === "VERIFICATION_PENDING") {
    const email = session.user.email;
    const path = email ? `/verify-request?email=${encodeURIComponent(email)}` : "/verify-request";
    return NextResponse.redirect(new URL(path, request.url));
  }

  if (portalRole && role !== portalRole) {
    // signOut() is allowed here because this is a Route Handler.
    await signOut({ redirectTo: "/login?error=not-authorized" });
  }

  if (role === "ADMIN") {
    const dest = safeCallback.startsWith("/admin") ? safeCallback : "/admin";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (role === "EDUCATOR") {
    const dest = safeCallback.startsWith("/educator") ? safeCallback : "/educator";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Students: never land in privileged workspaces.
  if (safeCallback.startsWith("/admin") || safeCallback.startsWith("/educator")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (safeCallback === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(new URL(safeCallback, request.url));
}
