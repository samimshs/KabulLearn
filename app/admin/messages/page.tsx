import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MessagesInbox } from "@/components/MessagesInbox";

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin%2Fmessages");
  if (session.user.role !== UserRole.ADMIN) redirect("/dashboard");

  const unreadCount = await db.directMessage.count({
    where: { recipientId: session.user.id, readAt: null }
  }).catch(() => 0);

  return (
    <main className="pr-page grid gap-6">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[#26364f] bg-[#07111f] p-7 lg:p-10">
        <p className="pr-eyebrow text-[#7ea7ff]">Admin Console</p>
        <h1 className="mt-4 text-[clamp(28px,4vw,46px)] font-[800] leading-[1.05] tracking-[-1px] text-white">
          Messages
          {unreadCount > 0 && (
            <span className="ms-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-[900] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </h1>
      </section>
      <MessagesInbox />
    </main>
  );
}
