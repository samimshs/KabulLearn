import { auth } from "@/auth";
import { HeaderClient } from "@/components/HeaderClient";

export async function Header() {
  let user: { name: string | null; role: string } | null = null;
  try {
    const session = await auth();
    if (session?.user?.id) {
      user = { name: session.user.name ?? null, role: session.user.role ?? "STUDENT" };
    }
  } catch {
    // DB unreachable or auth failure — render as unauthenticated
  }

  return <HeaderClient user={user} />;
}
