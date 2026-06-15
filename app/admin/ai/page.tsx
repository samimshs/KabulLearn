import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type SourceRef = { title?: string; href?: string; source?: string };

function sources(value: unknown): SourceRef[] {
  return Array.isArray(value) ? value.filter((item): item is SourceRef => Boolean(item && typeof item === "object")) : [];
}

export default async function AdminAiQualityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin%2Fai");
  if (session.user.role !== UserRole.ADMIN) redirect("/dashboard");

  const logs = await db.aiChatLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      question: true,
      answer: true,
      sources: true,
      rating: true,
      feedback: true,
      locale: true,
      createdAt: true,
      user: { select: { name: true, email: true } }
    }
  }).catch(() => []);

  const positive = logs.filter((log) => log.rating === 1).length;
  const negative = logs.filter((log) => log.rating === -1).length;

  return (
    <main className="pr-page grid gap-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-[12px] font-[800] text-[var(--brand)] underline-offset-2 hover:underline">
            Admin
          </Link>
          <h1 className="pr-h1 mt-2">AI quality review</h1>
          <p className="pr-copy mt-2 max-w-2xl">Review recent questions, source coverage, answer quality, and learner feedback.</p>
        </div>
        <Link href="/admin/audit" className="pr-btn-ghost">Audit logs</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="pr-eyebrow">Recent chats</p>
          <p className="mt-2 text-3xl font-[900] text-[var(--ink)]">{logs.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="pr-eyebrow">Helpful</p>
          <p className="mt-2 text-3xl font-[900] text-[var(--success)]">{positive}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="pr-eyebrow">Needs work</p>
          <p className="mt-2 text-3xl font-[900] text-[var(--danger)]">{negative}</p>
        </div>
      </section>

      <section className="grid gap-4">
        {logs.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
            No AI chats logged yet.
          </div>
        ) : logs.map((log) => (
          <article key={log.id} className="grid gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                {log.createdAt.toLocaleString()} · {log.locale ?? "unknown"} · {log.user.name ?? log.user.email}
              </p>
              {log.rating ? (
                <span className={`rounded-full px-3 py-1 text-[11px] font-[900] ${log.rating > 0 ? "bg-[var(--success-50)] text-[var(--success)]" : "bg-[var(--danger-50)] text-[var(--danger)]"}`}>
                  {log.rating > 0 ? "Helpful" : "Needs work"}
                </span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <p className="font-[900] text-[var(--ink)]">Question</p>
              <p className="rounded-[var(--radius)] bg-[var(--surface)] p-3 text-[13px] leading-relaxed">{log.question}</p>
            </div>
            <div className="grid gap-2">
              <p className="font-[900] text-[var(--ink)]">Answer</p>
              <p className="max-h-56 overflow-auto whitespace-pre-wrap rounded-[var(--radius)] bg-[var(--surface)] p-3 text-[13px] leading-relaxed">{log.answer ?? "No answer captured."}</p>
            </div>
            {sources(log.sources).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sources(log.sources).slice(0, 6).map((source, index) => (
                  <span key={`${source.href}-${index}`} className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-[800] text-[var(--muted)]">
                    {source.title ?? source.source ?? "Source"}
                  </span>
                ))}
              </div>
            ) : null}
            {log.feedback ? <p className="text-[13px] font-[700] text-[var(--muted)]">Feedback: {log.feedback}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}
