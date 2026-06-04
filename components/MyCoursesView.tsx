"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { localize, localizeLevel } from "@/lib/i18n";

type CourseEntry = {
  id: string;
  titleEn: string;
  titlePs: string;
  titleDa?: string | null;
  descriptionEn: string;
  descriptionPs: string;
  descriptionDa?: string | null;
  level?: string | null;
  completedModules: number;
  totalModules: number;
  resumeLessonId: string | null;
  enrolledAt: Date;
};

export function MyCoursesView({
  courses,
  userName,
  dbError
}: {
  courses: CourseEntry[];
  userName: string | null;
  dbError?: boolean;
}) {
  const { locale, t } = useLanguage();

  return (
    <main className="pr-page grid gap-8">
      <section className="pr-panel grid gap-6 p-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:p-10">
        <div>
          <p className="pr-eyebrow">{t.myLearning}</p>
          <h1 className="pr-h1 mt-4 max-w-3xl">
            {t.myCourses}
          </h1>
        </div>
        <div className="flex items-end justify-between gap-4 lg:flex-col lg:items-end">
          <p className="text-sm font-[800] text-[var(--muted)]">
            {courses.length} {t.enrolledCourses}
          </p>
          <Link
            href="/"
            className="pr-btn-ghost"
          >
            {t.availableCourses}
          </Link>
        </div>
      </section>

      {dbError ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-8 text-center">
          <p className="pr-eyebrow text-[var(--warning)]">Database unavailable</p>
          <p className="mt-2 font-[700] text-[var(--warning)]">Could not load your courses. Please refresh in a moment.</p>
        </div>
      ) : courses.length === 0 ? (
        <section className="pr-muted-box text-center">
          <p className="text-lg font-[800] text-[var(--muted)]">{t.noEnrolledCourses}</p>
          <Link
            href="/"
            className="pr-btn-primary mt-5"
          >
            {t.availableCourses}
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const title = localize(locale, course.titleEn, course.titlePs, course.titleDa);
            const description = localize(locale, course.descriptionEn, course.descriptionPs, course.descriptionDa);
            const level = localizeLevel(course.level, locale);
            const pct = course.totalModules > 0
              ? Math.round((course.completedModules / course.totalModules) * 100)
              : 0;
            const isComplete = pct === 100;

            return (
              <article
                key={course.id}
                className="pr-card grid min-h-72 content-between p-6 transition hover:-translate-y-1 hover:border-[rgba(0,87,255,0.26)] hover:shadow-[var(--shadow-lg)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    {level ? (
                      <span className="pr-badge">
                        {level}
                      </span>
                    ) : null}
                    {isComplete ? (
                      <span className="rounded-full border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--success)]">
                        {t.completed}
                      </span>
                    ) : (
                      <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                        {course.completedModules}/{course.totalModules} {t.modulesComplete}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-2xl font-[800] tracking-[-0.45px] text-[var(--ink)]">{title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm font-[500] leading-6 text-[var(--muted)]">{description}</p>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-2 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                      <span>{t.progress}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                      <div
                        className={`h-2 rounded-full transition-all ${isComplete ? "bg-[var(--success)]" : "bg-[var(--brand)]"}`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pct}% ${t.progress}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/courses/${course.id}`}
                    className="pr-btn-ghost"
                  >
                    {t.viewCourse}
                  </Link>
                  {course.resumeLessonId && !isComplete ? (
                    <Link
                      href={`/courses/${course.id}/lessons/${course.resumeLessonId}`}
                      className="pr-btn-primary"
                    >
                      {t.continueLesson}
                    </Link>
                  ) : isComplete ? (
                    <Link
                      href={`/courses/${course.id}/certificate`}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-[var(--radius)] bg-[var(--success)] px-4 text-sm font-[800] text-white transition hover:bg-[#126b4b]"
                    >
                      {t.downloadCertificate}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
