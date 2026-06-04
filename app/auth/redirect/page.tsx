import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthRedirectPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  const status = session?.user?.status;
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  if (role === "ADMIN") redirect("/admin");
  if (role === "EDUCATOR") redirect("/educator");

  if (!role) {
    redirect("/login");
  }

  if (status === "VERIFICATION_PENDING") {
    redirect(`/verify-request${session.user.email ? `?email=${encodeURIComponent(session.user.email)}` : ""}`);
  }

  // Students can return to learning pages, but never privileged workspaces.
  if (safeCallback.startsWith("/admin") || safeCallback.startsWith("/educator")) {
    redirect("/dashboard");
  }

  redirect(safeCallback);
}
