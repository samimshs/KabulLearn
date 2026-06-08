import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { MessagesInbox } from "@/components/MessagesInbox";

export const metadata = { title: "Messages — Educator Portal" };

export default async function EducatorMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Feducator%2Fmessages");
  if (session.user.role !== UserRole.EDUCATOR) {
    redirect(session.user.role === UserRole.ADMIN ? "/admin" : "/dashboard");
  }

  return (
    <main className="pr-page grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pr-eyebrow">Educator Portal</p>
          <h1 className="pr-h2 mt-1">Messages</h1>
        </div>
        <Link href="/educator" className="pr-btn-ghost !min-h-9 px-4 text-[13px]">
          ← Back to workspace
        </Link>
      </div>
      <Suspense fallback={null}>
        <MessagesInbox />
      </Suspense>
    </main>
  );
}
