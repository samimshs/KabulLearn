import { auth } from "@/auth";
import { db } from "@/lib/db";
import { HeaderClient } from "@/components/HeaderClient";

export async function Header() {
  let user: { name: string | null; role: string; image: string | null } | null = null;
  let unreadCount = 0;
  try {
    const session = await auth();
    if (session?.user?.id) {
      user = { name: session.user.name ?? null, role: session.user.role ?? "STUDENT", image: session.user.image ?? null };
      unreadCount = await db.directMessage.count({
        where: { recipientId: session.user.id, readAt: null }
      }).catch(() => 0);
    }
  } catch {
    // DB unreachable or auth failure — render as unauthenticated
  }

  return <HeaderClient user={user} initialUnread={unreadCount} />;
}
