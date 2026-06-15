import Link from "next/link";
import { DonationCheckoutForm } from "@/components/DonationCheckoutForm";
import { db } from "@/lib/db";
import { getPublicInfoContent } from "@/lib/info-translations";
import { dictionaries } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export const metadata = {
  title: "Support KabulLearn",
  description: "Support KabulLearn and help expand access to practical education in English, Pashto, and Dari for Afghan learners worldwide."
};

const icons = [
  <svg key="courses" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
  <svg key="server" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>,
  <svg key="globe" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  <svg key="cert" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>,
];

export default async function SupportKabulLearnPage() {
  const locale = await getServerLocale();
  const d = getPublicInfoContent(locale).donate;
  const t = dictionaries[locale];
  let supporterCount = 0;
  let totalRaisedCents = 0;
  let recentSupporters: Array<{ id: string; donorName: string | null }> = [];

  try {
    const [aggregate, rows] = await Promise.all([
      db.payment.aggregate({
        where: { purpose: "DONATION", status: "PAID" },
        _count: { id: true },
        _sum: { amountCents: true }
      }),
      db.payment.findMany({
        where: { purpose: "DONATION", status: "PAID" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, donorName: true }
      })
    ]);
    supporterCount = aggregate._count.id;
    totalRaisedCents = aggregate._sum.amountCents ?? 0;
    recentSupporters = rows;
  } catch {
    // Keep the donation page usable if public stats are temporarily unavailable.
  }

  const money = new Intl.NumberFormat(locale === "en" ? "en-US" : "fa-AF", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: totalRaisedCents % 100 === 0 ? 0 : 2
  }).format(totalRaisedCents / 100);

  return (
    <main className="pr-page py-12 lg:py-20">

      {/* Hero */}
      <section className="pr-panel px-6 py-10 text-center sm:px-10 lg:py-14">
        <p className="pr-eyebrow">{d.eyebrow}</p>
        <h1 className="pr-h1 mt-4">{d.title}</h1>
        <p className="pr-copy mx-auto mt-5 max-w-xl text-base">{d.description}</p>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] font-[600] leading-7 text-[var(--ink-2)]">
          {d.longDescription}
        </p>

        {/* CTA */}
        <DonationCheckoutForm />
      </section>

      {/* Purpose cards */}
      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {d.purposes.map((p, i) => (
          <div key={p.title} className="pr-card p-6">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--brand-50)]">
              {icons[i]}
            </div>
            <h2 className="mt-4 text-[15px] font-[800] text-[var(--ink)]">{p.title}</h2>
            <p className="mt-2 text-sm font-[600] leading-6 text-[var(--muted)]">{p.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(0,87,255,0.07),rgba(24,130,92,0.08))] px-6 py-6 sm:px-8">
          <p className="pr-eyebrow">{t.donationDashboardEyebrow}</p>
          <h2 className="pr-h2 mt-2">{t.donationDashboardTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm font-[600] leading-6 text-[var(--muted)]">
            {t.donationDashboardDescription}
          </p>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[12px] font-[900] uppercase tracking-[1.4px] text-[var(--muted)]">{t.totalSupporters}</p>
            <p className="mt-2 text-[34px] font-[900] tracking-[-0.6px] text-[var(--ink)]">{supporterCount.toLocaleString(locale === "en" ? "en-US" : "fa-AF")}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[12px] font-[900] uppercase tracking-[1.4px] text-[var(--muted)]">{t.totalRaised}</p>
            <p className="mt-2 text-[34px] font-[900] tracking-[-0.6px] text-[var(--ink)]">{money}</p>
          </div>
        </div>
        <div className="border-t border-[var(--border)] px-6 pb-6 sm:px-8 sm:pb-8">
          <h3 className="pt-6 text-[16px] font-[900] text-[var(--ink)]">{t.recentSupporters}</h3>
          {recentSupporters.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentSupporters.map((supporter) => (
                <article key={supporter.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <p className="truncate text-sm font-[900] text-[var(--ink)]">
                    {supporter.donorName?.trim() || t.anonymousSupporter}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm font-[700] text-[var(--muted)]">
              {t.noSupportersYet}
            </p>
          )}
          <p className="mt-4 text-xs font-[600] leading-6 text-[var(--muted-2)]">{t.donationDashboardPrivacy}</p>
        </div>
      </section>

      {/* Legal disclosure */}
      <section className="mt-8 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center">
        <p className="text-[13px] font-[600] leading-7 text-[var(--muted)]">{d.disclosure}</p>
        <p className="mt-3 text-[12px] font-[600] text-[var(--muted-2)]">
          {d.questions}{" "}
          <a href="mailto:info@kabulhub.com" className="text-[var(--brand)] hover:underline">
            info@kabulhub.com
          </a>
        </p>
      </section>

      {/* Back to learning */}
      <div className="mt-8 text-center">
        <Link href="/courses" className="text-[13px] font-[700] text-[var(--muted)] hover:text-[var(--brand)] transition-colors">
          {d.browseCourses}
        </Link>
      </div>
    </main>
  );
}
