import Link from "next/link";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";

export const metadata = {
  title: "Support KabulLearn",
  description: "Support KabulLearn and help expand access to practical education in English, Pashto, and Dari for Afghan learners worldwide."
};

const donationLink = process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK || null;

const icons = [
  <svg key="courses" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
  <svg key="server" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>,
  <svg key="globe" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  <svg key="cert" viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>,
];

export default async function SupportKabulLearnPage() {
  const locale = await getServerLocale();
  const d = getPublicInfoContent(locale).donate;

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
        <div className="mt-8 flex flex-col items-center gap-3">
          {donationLink ? (
            <a
              href={donationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="pr-btn-primary inline-flex items-center gap-2 px-8 !min-h-11 text-[15px]"
            >
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {d.ctaButton}
            </a>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[rgba(0,87,255,0.14)] bg-[var(--brand-50)] px-6 py-5 text-center">
              <p className="text-[15px] font-[800] text-[var(--ink)]">{d.ctaComingSoon}</p>
              <p className="mt-2 text-sm font-[600] text-[var(--muted)]">
                {d.questions}{" "}
                <a href="mailto:info@kabulhub.com" className="font-[800] text-[var(--brand)] hover:underline">
                  info@kabulhub.com
                </a>
              </p>
            </div>
          )}
        </div>
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
