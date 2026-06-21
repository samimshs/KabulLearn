import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";
import { VideoPlaceholder } from "@/components/InfoPage";
import { getSiteVideoUrls } from "@/lib/actions/site-settings-actions";
import { VIDEO_KEYS } from "@/lib/site-settings-keys";

export const metadata: Metadata = {
  title: "About — KabulLearn",
  description: "KabulLearn is an online learning platform for Afghan learners, with structured courses in English, Pashto, and Dari.",
};

export default async function AboutPage() {
  const locale = await getServerLocale();
  const t = dictionaries[locale];
  const c = getPublicInfoContent(locale).about;

  let courseCount = 0;
  let lessonCount = 0;
  let learnerCount = 0;
  const videos = await getSiteVideoUrls().catch(() => ({} as Record<string, string>));
  try {
    [courseCount, lessonCount, learnerCount] = await Promise.all([
      db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      db.lesson.count({ where: { module: { course: { status: CourseStatus.PUBLISHED } } } }),
      db.user.count({ where: { role: "STUDENT" } }),
    ]);
  } catch { /* DB unavailable — hide stats */ }

  const stats = [
    courseCount > 0 && { value: `${courseCount}+`, label: locale === "ps" ? "کورسونه" : locale === "fa" ? "دوره" : "Courses" },
    lessonCount > 0 && { value: `${lessonCount}+`, label: locale === "ps" ? "درسونه" : locale === "fa" ? "درس" : "Lessons" },
    { value: "3", label: locale === "ps" ? "ژبې" : locale === "fa" ? "زبان" : "Languages" },
    learnerCount > 0 && { value: `${learnerCount}+`, label: locale === "ps" ? "زده کوونکي" : locale === "fa" ? "فراگیر" : "Learners" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">

      {/* Hero */}
      <section className="pr-panel px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        <p className="pr-eyebrow">{c.eyebrow}</p>
        <h1 className="pr-h1 mt-4 max-w-3xl">{c.title}</h1>
        <p className="pr-copy mt-5 max-w-2xl text-base">{c.description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/register" className="pr-btn-primary">{c.startLearning}</Link>
          <Link href="/for-educators" className="pr-btn-ghost">{c.teach}</Link>
        </div>
      </section>

      {/* Mission + video side by side */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="pr-card p-6 sm:p-8">
          <h2 className="text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">{c.missionTitle}</h2>
          <div className="mt-5 space-y-4 text-[15px] font-[500] leading-8 text-[var(--muted)]">
            {c.missionParagraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>

        <VideoPlaceholder
          title={t.introVideoTitle}
          description={t.introVideoDescription}
          youtubeUrl={videos[VIDEO_KEYS.intro]}
        />
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="pr-card p-6 sm:p-8">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-[13px] font-[700] text-[var(--muted)]">{stat.label}</dt>
                <dd className="mt-1 text-[36px] font-[900] tracking-[-1px] text-[var(--brand)]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* What we offer */}
      <section className="pr-card p-6 sm:p-8">
        <h2 className="text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">{c.offersTitle}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {c.offers.map((offer) => (
            <div key={offer.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[17px] font-[800] text-[var(--ink)]">{offer.title}</h3>
              <p className="mt-2 text-[13px] font-[600] leading-6 text-[var(--muted)]">{offer.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Organisation */}
      <section className="pr-card p-6 sm:p-8">
        <h2 className="text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">{c.orgTitle}</h2>
        <p className="mt-4 text-[15px] font-[500] leading-8 text-[var(--muted)]">
          {c.orgText.split("info@kabulhub.com")[0]}
          <a href="mailto:info@kabulhub.com" className="font-[700] text-[var(--brand)] hover:underline underline-offset-2">
            info@kabulhub.com
          </a>
          {c.orgText.split("info@kabulhub.com")[1]}
        </p>
      </section>


    </main>
  );
}
