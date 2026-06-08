import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth, signOut } from "@/auth";

function requiredRoleForPortal(portal: string | undefined) {
  if (portal === "admin") return UserRole.ADMIN;
  if (portal === "educator") return UserRole.EDUCATOR;
  if (portal === "student") return UserRole.STUDENT;
  return null;
}

export default async function AuthRedirectPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; portal?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  const status = session?.user?.status;
  const { callbackUrl, portal } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";
  const portalRole = requiredRoleForPortal(portal);

  if (!role) {
    redirect("/login");
  }

  if (status === "VERIFICATION_PENDING") {
    redirect(`/verify-request${session.user.email ? `?email=${encodeURIComponent(session.user.email)}` : ""}`);
  }

  if (portalRole && role !== portalRole) {
    await signOut({ redirectTo: "/login?error=not-authorized" });
  }

  if (role === "ADMIN") {
    redirect(safeCallback.startsWith("/admin") ? safeCallback : "/admin");
  }

  if (role === "EDUCATOR") {
    redirect(safeCallback.startsWith("/educator") ? safeCallback : "/educator");
  }

  // Students can return to learning pages, but never privileged workspaces.
  if (safeCallback.startsWith("/admin") || safeCallback.startsWith("/educator")) {
    redirect("/dashboard");
  }

  if (safeCallback === "/") {
    redirect("/dashboard");
  }

  redirect(safeCallback);
}
