import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function prettyJson(value: unknown) {
  if (!value) return "None";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin%2Faudit");
  if (session.user.role !== UserRole.ADMIN) redirect("/dashboard");

  const events = await db.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      targetId: true,
      targetType: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true, email: true } }
    }
  }).catch(() => []);

  return (
    <main className="pr-page grid gap-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-[12px] font-[800] text-[var(--brand)] underline-offset-2 hover:underline">
            Admin
          </Link>
          <h1 className="pr-h1 mt-2">Audit logs</h1>
          <p className="pr-copy mt-2 max-w-2xl">Review sensitive admin actions, target records, and metadata for accountability.</p>
        </div>
        <Link href="/admin/ai" className="pr-btn-ghost">AI quality review</Link>
      </header>

      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[11px] font-[900] uppercase tracking-[1px] text-[var(--muted)] max-lg:hidden">
          <span>When</span>
          <span>Actor</span>
          <span>Action</span>
          <span>Target / metadata</span>
        </div>
        {events.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">No audit events yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {events.map((event) => (
              <article key={event.id} className="grid gap-3 px-4 py-4 text-[13px] lg:grid-cols-[1fr_1fr_1fr_1fr]">
                <p className="font-[700] text-[var(--ink)]">{event.createdAt.toLocaleString()}</p>
                <p className="text-[var(--muted)]">{event.actor.name ?? event.actor.email}</p>
                <p className="font-[900] text-[var(--brand)]">{event.action}</p>
                <div className="min-w-0">
                  <p className="font-[800] text-[var(--ink-2)]">{event.targetType ?? "target"}: {event.targetId ?? "none"}</p>
                  <pre className="mt-2 max-h-36 overflow-auto rounded-[var(--radius)] bg-[var(--surface)] p-3 text-[11px] leading-relaxed text-[var(--muted)]">{prettyJson(event.metadata)}</pre>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
