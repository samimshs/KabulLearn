import Link from "next/link";
import { HomeHeroVisual } from "@/components/HomeHeroVisual";
import { HeroLangPills } from "@/components/HeroLangPills";
import { auth } from "@/auth";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

function formatNumber(value: number, locale: Locale) {
  const numberLocale = locale === "en" ? "en-US" : `${locale}-AF`;
  return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(value);
}

function fmtStat(n: number, fallback: number, locale: Locale): string {
  const value = n === 0 ? fallback : n;
  if (value >= 1000) return `${formatNumber(Math.floor(value / 1000), locale)}K+`;
  return `${formatNumber(value, locale)}+`;
}

const STAT_ICONS = {
  courses:   <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><path d="M10 5C8 3.7 4.8 3.4 3 4v11c1.8-.6 5-.3 7 1M10 5c2-1.3 5.2-1.6 7-1v11c-1.8-.6-5-.3-7 1M10 5v11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  lessons:   <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" /><path d="M8.4 7.4 13 10l-4.6 2.6V7.4Z" fill="currentColor" /></svg>,
  languages: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 10h14M10 3c2.1 2.2 2.1 11.8 0 14M10 3c-2.1 2.2-2.1 11.8 0 14" stroke="currentColor" strokeWidth="1.3" /></svg>,
  learners:  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><circle cx="7.5" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.5" /><path d="M3 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M13.5 6.2A2.4 2.4 0 0 1 15 11M14 12.2c1.8.3 3 1.7 3 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
};

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  const locale = await getServerLocale();
  const dict = dictionaries[locale];

  const features = [
    {
      label: dict.featureStructured,
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 6C9.5 4.3 5.5 4 3 4.7v13C5.5 17 9.5 17.3 12 19M12 6c2.5-1.7 6.5-2 9-1.3v13c-2.5-.7-6.5-.4-9 1.3M12 6v13" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
    },
    {
      label: dict.featurePractice,
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.7" /><path d="M9 9.2a3 3 0 0 1 5.1 1.9c0 2.1-2.3 2.1-2.3 3.6M12 17.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      label: dict.featureCerts,
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.7" /><path d="m9 13-1.5 8L12 19l4.5 2L15 13" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
    },
    {
      label: dict.featureTrilingual,
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" stroke="currentColor" strokeWidth="1.5" /></svg>,
    },
  ];

  // Live platform stats — fall back to placeholder values if DB is unavailable
  let courseCount = 0, lessonCount = 0, learnerCount = 0;
  try {
    [courseCount, lessonCount, learnerCount] = await Promise.all([
      db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      db.lesson.count({ where: { module: { course: { status: CourseStatus.PUBLISHED } } } }),
      db.user.count({ where: { role: "STUDENT" } }),
    ]);
  } catch { /* DB unavailable — placeholders shown */ }

  const platformStats = [
    { icon: STAT_ICONS.courses,   value: fmtStat(courseCount, 25, locale),     label: dict.courses },
    { icon: STAT_ICONS.lessons,   value: fmtStat(lessonCount, 400, locale),    label: dict.lessons },
    { icon: STAT_ICONS.languages, value: formatNumber(3, locale),              label: dict.statLanguages },
    { icon: STAT_ICONS.learners,  value: fmtStat(learnerCount, 1000, locale),  label: dict.statLearners },
  ];

  return (
    <main className="pr-page kl-home-page">
      <section className="kl-home-hero grid items-center gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="kl-home-copy flex flex-col gap-5">
          <img
            src="/poharana-logo-v3.svg"
            alt="KabulLearn"
            className="kl-home-logo h-auto w-[276px] max-w-[78vw] object-contain"
          />
          <p className="pr-eyebrow kl-home-kicker">{dict.heroEyebrow}</p>
          <h1 className="pr-h1 kl-home-heading">{dict.heroHeading}</h1>
          <p className="pr-copy kl-home-subheadline">{dict.heroSubtext}</p>

          <div className="kl-home-cta flex flex-wrap gap-2">
            {role === "STUDENT" ? (
              <Link href="/dashboard" className="pr-btn-primary">Resume Learning</Link>
            ) : role === "EDUCATOR" ? (
              <Link href="/educator" className="pr-btn-primary">Go to Creator Workspace</Link>
            ) : role === "ADMIN" ? (
              <Link href="/admin" className="pr-btn-primary">Go to Admin Portal</Link>
            ) : (
              <>
                <Link href="/courses" className="pr-btn-primary">{dict.heroCta}</Link>
                <Link href="/educator" className="pr-btn-ghost">
                  {dict.heroForEducators}
                  <svg viewBox="0 0 22 22" className="h-5 w-5 shrink-0 text-[var(--brand)]" fill="none" aria-hidden="true">
                    <path d="M11 3 2 8l9 5 9-5-9-5Z" fill="currentColor" />
                    <path d="M5.5 10.8v4C5.5 16.6 8 18 11 18s5.5-1.4 5.5-3.2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 8v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </Link>
              </>
            )}
          </div>

          <ul className="kl-feature-list grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.label} className="grid justify-items-center gap-1 text-center">
                <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--brand-50)] text-[var(--brand)]">
                  {feature.icon}
                </span>
                <span className="text-[10px] font-[800] leading-tight text-[var(--ink-2)]">{feature.label}</span>
              </li>
            ))}
          </ul>

          <div className="kl-home-lang">
            <HeroLangPills />
          </div>
        </div>

        <div className="kl-home-art">
          <HomeHeroVisual stats={platformStats} />
        </div>
      </section>
    </main>
  );
}
