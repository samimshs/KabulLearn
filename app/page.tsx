import Link from "next/link";
import { HomeHeroVisual } from "@/components/HomeHeroVisual";
import { CourseCard, type CourseCardRow } from "@/components/CourseCard";
import { EducatorCta } from "@/components/CourseDashboard";
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

function fmtStat(value: number, locale: Locale): string {
  if (value >= 1000) return `${formatNumber(Math.floor(value / 1000), locale)}K+`;
  return `${formatNumber(value, locale)}+`;
}

const STAT_ICONS = {
  courses:   <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><path d="M10 5C8 3.7 4.8 3.4 3 4v11c1.8-.6 5-.3 7 1M10 5c2-1.3 5.2-1.6 7-1v11c-1.8-.6-5-.3-7 1M10 5v11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  lessons:   <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" /><path d="M8.4 7.4 13 10l-4.6 2.6V7.4Z" fill="currentColor" /></svg>,
  languages: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 10h14M10 3c2.1 2.2 2.1 11.8 0 14M10 3c-2.1 2.2-2.1 11.8 0 14" stroke="currentColor" strokeWidth="1.3" /></svg>,
  learners:  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><circle cx="7.5" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.5" /><path d="M3 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M13.5 6.2A2.4 2.4 0 0 1 15 11M14 12.2c1.8.3 3 1.7 3 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
};

const HOW_ICONS = [
  <svg key="account" viewBox="0 0 24 24" className="h-6 w-6" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" /><path d="M5 19.5c0-3.3 3-5.2 7-5.2s7 1.9 7 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  <svg key="learn" viewBox="0 0 24 24" className="h-6 w-6" fill="none"><path d="M12 6C9.5 4.3 5.5 4 3 4.7v13C5.5 17 9.5 17.3 12 19M12 6c2.5-1.7 6.5-2 9-1.3v13c-2.5-.7-6.5-.4-9 1.3M12 6v13" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  <svg key="cert" viewBox="0 0 24 24" className="h-6 w-6" fill="none"><circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.7" /><path d="m9 13-1.5 8L12 19l4.5 2L15 13" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
];

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

  // Live platform stats and featured courses. Stats with no real value are
  // hidden rather than replaced with invented placeholders.
  let courseCount = 0, lessonCount = 0, learnerCount = 0;
  let featured: CourseCardRow[] = [];
  try {
    const [counts, featuredRaw] = await Promise.all([
      Promise.all([
        db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
        db.lesson.count({ where: { module: { course: { status: CourseStatus.PUBLISHED } } } }),
        db.user.count({ where: { role: "STUDENT" } }),
      ]),
      db.course.findMany({
        where: { status: CourseStatus.PUBLISHED },
        orderBy: { enrollments: { _count: "desc" } },
        take: 4,
        select: {
          id: true,
          slug: true,
          titleEn: true, titlePs: true, titleDa: true,
          descriptionEn: true, descriptionPs: true, descriptionDa: true,
          level: true,
          _count: { select: { enrollments: true } },
          authorProfile: { select: { name: true, username: true, avatarUrl: true } },
          instructors: { orderBy: { order: "asc" }, select: { profile: { select: { name: true, username: true, avatarUrl: true } } } },
          modules: {
            orderBy: [{ order: "asc" }],
            select: {
              id: true,
              order: true,
              lessons: { orderBy: [{ order: "asc" }], select: { id: true, order: true, isFinalTest: true } }
            }
          }
        }
      })
    ]);
    [courseCount, lessonCount, learnerCount] = counts;
    featured = featuredRaw.map((course) => ({
      id: course.id,
      slug: course.slug,
      titleEn: course.titleEn ?? course.titlePs ?? "",
      titlePs: course.titlePs ?? course.titleEn ?? "",
      titleDa: course.titleDa,
      descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
      descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
      descriptionDa: course.descriptionDa,
      level: course.level,
      hasCertificate: course.modules.length > 0 &&
        course.modules.every((module) => module.lessons.some((lesson) => lesson.isFinalTest)),
      modules: course.modules.map((module) => ({
        id: module.id,
        order: module.order,
        lessons: module.lessons.map((lesson) => ({ id: lesson.id, order: lesson.order }))
      })),
      enrollmentCount: course._count.enrollments,
      instructors: course.instructors.length > 0
        ? course.instructors.map((courseInstructor) => courseInstructor.profile)
        : course.authorProfile
          ? [course.authorProfile]
          : []
    }));
  } catch { /* DB unavailable — sections degrade gracefully */ }

  const platformStats = [
    courseCount > 0 ? { icon: STAT_ICONS.courses, value: fmtStat(courseCount, locale), label: dict.courses } : null,
    lessonCount > 0 ? { icon: STAT_ICONS.lessons, value: fmtStat(lessonCount, locale), label: dict.lessons } : null,
    { icon: STAT_ICONS.languages, value: formatNumber(3, locale), label: dict.statLanguages },
    learnerCount > 0 ? { icon: STAT_ICONS.learners, value: fmtStat(learnerCount, locale), label: dict.statLearners } : null,
  ].filter((stat): stat is NonNullable<typeof stat> => stat !== null);

  const howSteps = [
    { title: dict.howStep1Title, body: dict.howStep1Body },
    { title: dict.howStep2Title, body: dict.howStep2Body },
    { title: dict.howStep3Title, body: dict.howStep3Body },
  ];

  return (
    <main className="pr-page kl-home-page">
      <section className="kl-home-hero grid items-start gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="kl-home-copy flex flex-col gap-5">
          <p className="pr-eyebrow kl-home-kicker">{dict.heroEyebrow}</p>
          <h1 className="pr-h1 kl-home-heading">{dict.heroHeading}</h1>
          <p className="pr-copy kl-home-subheadline">{dict.heroSubtext}</p>

          <div className="kl-home-cta flex flex-wrap gap-2">
            {role === "STUDENT" ? (
              <Link href="/dashboard" className="pr-btn-primary">{dict.resumeLearning}</Link>
            ) : role === "EDUCATOR" ? (
              <Link href="/educator" className="pr-btn-primary">{dict.goToCreatorWorkspace}</Link>
            ) : role === "ADMIN" ? (
              <Link href="/admin" className="pr-btn-primary">{dict.goToAdminPortal}</Link>
            ) : (
              <>
                <Link href="/register" className="pr-btn-primary">{dict.startLearningFree}</Link>
                <Link href="/courses" className="pr-btn-ghost">{dict.heroCta}</Link>
              </>
            )}
          </div>

          <ul className="kl-feature-list flex flex-wrap gap-2.5">
            {features.map((feature) => (
              <li
                key={feature.label}
                className="flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-white/75 py-2 pe-4 ps-2 shadow-[var(--shadow-sm)] backdrop-blur-sm"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--brand-50)] text-[var(--brand)]">
                  {feature.icon}
                </span>
                <span className="text-[13px] font-[700] leading-none text-[var(--ink-2)]">{feature.label}</span>
              </li>
            ))}
          </ul>

        </div>

        <div className="kl-home-art">
          <HomeHeroVisual stats={platformStats} />
        </div>

        <a href="#kl-home-more" aria-label={dict.featuredCoursesTitle} className="kl-scroll-cue">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M3.5 6 8 10.5 12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      <div id="kl-home-more" className="kl-home-body">
      {/* Featured courses */}
      {featured.length > 0 && (
        <section className="mt-14" aria-label={dict.featuredCoursesTitle}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="pr-eyebrow">{dict.featuredCoursesEyebrow}</p>
              <h2 className="pr-h2 mt-2">{dict.featuredCoursesTitle}</h2>
            </div>
            <Link href="/courses" className="text-[14px] font-[800] text-[var(--brand)] hover:underline underline-offset-2">
              {dict.viewAllCourses} →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((course) => (
              <CourseCard key={course.id} course={course} isAuthenticated={Boolean(session?.user?.id)} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mt-14" aria-label={dict.howItWorksTitle}>
        <div className="pr-panel p-7 lg:p-10">
          <p className="pr-eyebrow">{dict.howItWorksEyebrow}</p>
          <h2 className="pr-h2 mt-2">{dict.howItWorksTitle}</h2>
          <ol className="mt-7 grid gap-6 md:grid-cols-3">
            {howSteps.map((step, i) => (
              <li key={step.title} className="relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--brand-50)] text-[var(--brand)]">
                    {HOW_ICONS[i]}
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gold-50)] text-[13px] font-[800] text-[var(--gold-deep)] ring-1 ring-[rgba(201,168,76,0.4)]">
                    {formatNumber(i + 1, locale)}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-[800] text-[var(--ink)]">{step.title}</h3>
                <p className="mt-2 text-[14px] font-[400] leading-relaxed text-[var(--muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Educator CTA — hidden for users who already have a workspace */}
      {role !== "EDUCATOR" && role !== "ADMIN" && <EducatorCta />}

      {/* Closing CTA — guests only */}
      {!role && (
        <section className="mt-14 mb-4 rounded-[var(--radius-xl)] bg-gradient-to-br from-[#021533] via-[#00255f] to-[var(--brand)] px-7 py-12 text-center lg:py-16">
          <h2 className="text-[28px] font-[800] tracking-[-0.6px] text-white lg:text-[34px]">
            {dict.homeClosingTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] font-[400] leading-relaxed text-white/80">
            {dict.homeClosingBody}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="pr-btn-primary !border-white !bg-white !text-[var(--brand)] hover:!bg-white/90">
              {dict.startLearningFree}
            </Link>
            <Link href="/courses" className="pr-btn-ghost !border-white/40 !bg-transparent !text-white hover:!border-white hover:!text-white">
              {dict.heroCta}
            </Link>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
