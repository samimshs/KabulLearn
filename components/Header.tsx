import { auth } from "@/auth";
import { db } from "@/lib/db";
import { HeaderClient } from "@/components/HeaderClient";

export type MessagePreview = {
  senderId: string;
  senderName: string | null;
  senderRole: string;
  snippet: string;
  createdAt: string;
};

export async function Header() {
  let user: { name: string | null; role: string; image: string | null } | null = null;
  let unreadCount = 0;
  let messagePreviews: MessagePreview[] = [];

  try {
    const session = await auth();
    if (session?.user?.id) {
      user = { name: session.user.name ?? null, role: session.user.role ?? "STUDENT", image: session.user.image ?? null };

      const [count, rawMessages] = await Promise.all([
        db.directMessage.count({
          where: { recipientId: session.user.id, readAt: null }
        }).catch(() => 0),
        db.directMessage.findMany({
          where: { recipientId: session.user.id, readAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            body: true,
            createdAt: true,
            sender: { select: { id: true, name: true, role: true } }
          }
        }).catch(() => [])
      ]);

      unreadCount = count;

      // Deduplicate by sender — one preview per conversation
      const seen = new Set<string>();
      for (const msg of rawMessages) {
        if (seen.has(msg.sender.id)) continue;
        seen.add(msg.sender.id);
        messagePreviews.push({
          senderId: msg.sender.id,
          senderName: msg.sender.name,
          senderRole: msg.sender.role,
          snippet: msg.body.slice(0, 72),
          createdAt: msg.createdAt.toISOString()
        });
        if (messagePreviews.length >= 3) break;
      }
    }
  } catch {
    // DB unreachable or auth failure — render as unauthenticated
  }

  return <HeaderClient user={user} initialUnread={unreadCount} messagePreviews={messagePreviews} />;
}
