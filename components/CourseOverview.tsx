"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { getPassedQuizzes, isModuleUnlocked, getResumeLessonId } from "@/lib/progress";
import { localize, localizeLevel } from "@/lib/i18n";
import { CourseRatingForm } from "@/components/CourseRatingForm";
import { CourseDiscussion } from "@/components/CourseDiscussion";
import type { Course, Lesson, Module } from "@prisma/client";

type CourseModule = Pick<Module, "id" | "order" | "titleEn" | "titlePs"> & {
  titleDa?: string | null;
  lessons: Array<Pick<Lesson, "id" | "order" | "titleEn" | "titlePs"> & { titleDa?: string | null }>;
};

type CertificateStatus = {
  eligible: boolean;
  hasCertificate?: boolean;
  grade?: number;
  issuedAt?: Date | string;
  verificationCode?: string;
};

type CourseOverviewProps = {
  course: Pick<
    Course,
    "id" | "titleEn" | "titlePs" | "descriptionEn" | "descriptionPs" | "level"
  > & {
    titleDa?: string | null;
    descriptionDa?: string | null;
    modules: CourseModule[];
    author?: {
      name: string;
      username: string;
      avatarUrl: string | null;
      professionalTitle: string | null;
      bio: string | null;
      linkedinUrl?: string | null;
      youtubeUrl?: string | null;
    } | null;
  };
  serverPassedModuleIds?: string[];
  certificateStatus?: CertificateStatus;
  isEnrolled?: boolean;
  userRating?: { rating: number; comment: string | null } | null;
  ratingSummary?: { average: number; count: number };
  reviews?: Array<{ id: string; rating: number; comment: string | null; user: { name: string | null; email: string } }>;
  progressPercent?: number;
  discussionThreads?: React.ComponentProps<typeof CourseDiscussion>["threads"];
};

export function CourseOverview({
  course,
  serverPassedModuleIds = [],
  certificateStatus,
  isEnrolled = false,
  userRating,
  ratingSummary,
  reviews = [],
  progressPercent = 0,
  discussionThreads = []
}: CourseOverviewProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set(serverPassedModuleIds));
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resumeLessonId, setResumeLessonId] = useState<string | null>(null);
  const moduleIds = course.modules.map((module) => module.id);
  const totalModules = course.modules.length;
  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  useEffect(() => {
    const localPassed = getPassedQuizzes(course.id, moduleIds);
    setPassedQuizzes(new Set([...localPassed, ...serverPassedModuleIds]));
    // Resume at next unvisited lesson, falling back to first lesson of next quiz-gated module
    const lastVisited = getResumeLessonId(course.id, allLessonIds);
    if (lastVisited) {
      setResumeLessonId(lastVisited);
    } else {
      const completedMods = serverPassedModuleIds.length;
      const fallbackModule = course.modules[completedMods] ?? course.modules[0];
      setResumeLessonId(fallbackModule?.lessons[0]?.id ?? null);
    }
  }, [course.id, moduleIds.join("|"), serverPassedModuleIds.join("|")]);

  const courseComplete = Boolean(certificateStatus?.eligible || certificateStatus?.hasCertificate);
  const completedModules = courseComplete ? totalModules : passedQuizzes.size;
  const primaryActionLabel =
    progressPercent <= 0
      ? "Start Learning"
      : progressPercent >= 100
        ? "View Course"
        : "Continue Learning";

  function handleEnroll() {
    startTransition(async () => {
      setEnrollError(null);

      try {
        const response = await fetch("/api/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id })
        });
        const result = (await response.json()) as { ok: boolean; error?: string };

        if (response.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`);
          return;
        }

        if (!response.ok || !result.ok) {
          setEnrollError(result.error ?? "Could not enroll right now. Please try again.");
          return;
        }

        setEnrolled(true);
        router.refresh();
      } catch {
        setEnrollError("Could not enroll right now. Please try again.");
      }
    });
  }

  return (
    <main className="pr-page grid gap-6">
      <section className="pr-panel p-7 lg:p-10">
        <p className="pr-eyebrow">{t.courses}</p>
        <h1 className="pr-h1 mt-4 max-w-4xl">
          {localize(locale, course.titleEn, course.titlePs, course.titleDa)}
        </h1>
        <p className="pr-copy mt-5 max-w-3xl">
          {localize(locale, course.descriptionEn, course.descriptionPs, course.descriptionDa)}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {localizeLevel(course.level, locale) ? (
            <span className="pr-badge">
              {localizeLevel(course.level, locale)}
            </span>
          ) : null}
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
            {completedModules}/{totalModules} {t.modulesComplete}
          </span>
          {enrolled ? (
            <span className="rounded-full border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--success)]">
              {t.enrolled}
            </span>
          ) : null}
          {ratingSummary && ratingSummary.count > 0 ? (
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-[900] uppercase tracking-[1px] text-[var(--ink)]">
              ★ {ratingSummary.average.toFixed(1)} ({ratingSummary.count})
            </span>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {enrolled ? (
            resumeLessonId ? (
              <Link
                href={progressPercent >= 100 ? `/courses/${encodeURIComponent(course.id)}` : `/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(resumeLessonId)}`}
                className="pr-btn-primary"
              >
                {primaryActionLabel}
              </Link>
            ) : null
          ) : (
            <button
              type="button"
              onClick={handleEnroll}
              disabled={isPending}
              className="pr-btn-primary"
              aria-label={t.enrollNow}
            >
              {isPending ? "..." : t.enrollNow}
            </button>
          )}
        </div>

        {enrollError ? (
          <p className="mt-3 rounded-[var(--radius)] border border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[800] text-[var(--danger)]" role="alert">{enrollError}</p>
        ) : null}
      </section>

      {/* Completion celebration banner */}
      {enrolled && certificateStatus?.eligible ? (
        <section className="grid gap-5 rounded-[var(--radius-xl)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] p-7 lg:grid-cols-[1fr_360px] lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[11px] font-[800] uppercase tracking-[3px] text-[var(--success)]">
                Course complete 🎉
              </p>
              <h2 className="mt-2 text-[22px] font-[800] tracking-[-0.4px] text-[#0A0914]">
                Congratulations! You finished this course.
              </h2>
              <p className="mt-2 text-sm font-[500] text-[var(--muted)]">
                Your grade: <strong className="text-[var(--ink)]">{certificateStatus.grade}%</strong>.
                Your certificate is ready to view and download.
              </p>
            </div>
            <Link
              href={`/courses/${encodeURIComponent(course.id)}/certificate`}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--success)] px-6 text-sm font-[800] text-white transition hover:bg-[#126b4b]"
            >
              View certificate
            </Link>
          </div>
          <CourseRatingForm
            courseId={course.id}
            initialRating={userRating?.rating}
            initialComment={userRating?.comment}
          />
        </section>
      ) : null}

      <section className="grid gap-5" aria-label={t.courseNavigation}>
        {course.modules.map((module, index) => {
          const unlocked = isModuleUnlocked(index, moduleIds, passedQuizzes);
          const passed = passedQuizzes.has(module.id);

          return (
            <article key={module.id} className="pr-card overflow-hidden">
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-[800] uppercase tracking-[2px] text-[var(--muted-2)]">
                    {t.modules} {index + 1}
                  </p>
                  <h2 className="mt-1 text-[22px] font-[800] tracking-[-0.45px] text-[var(--ink)]">
                    {localize(locale, module.titleEn, module.titlePs, module.titleDa)}
                  </h2>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-[800] uppercase tracking-[1px] ${
                    passed
                      ? "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]"
                      : unlocked
                        ? "border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] text-[var(--warning)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                  aria-label={passed ? t.passedQuiz : unlocked ? t.quiz : t.locked}
                >
                  {passed ? t.passedQuiz : unlocked ? t.quiz : t.locked}
                </span>
              </div>
              </div>
              <div className="grid gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-4">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="grid gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-[800] text-[var(--ink-2)]">
                        {localize(locale, lesson.titleEn, lesson.titlePs, lesson.titleDa)}
                      </p>
                      {enrolled && unlocked ? (
                        <Link
                          href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}`}
                          className="text-sm font-[800] text-[var(--brand)] hover:underline"
                          aria-label={`${t.continueLesson}: ${localize(locale, lesson.titleEn, lesson.titlePs, lesson.titleDa)}`}
                        >
                          {t.continueLesson}
                        </Link>
                      ) : !enrolled ? (
                        <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--brand)]">{t.enrollNow}</span>
                      ) : (
                        <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]" aria-label={t.locked}>
                          {t.locked}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      {course.author ? (
        <Link
          href={`/creators/${encodeURIComponent(course.author.username)}`}
          className="pr-card grid gap-5 p-6 transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.28)] hover:shadow-[var(--shadow)] lg:grid-cols-[auto_1fr] lg:p-7"
        >
          {course.author.avatarUrl ? (
            <img src={course.author.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-50)] text-lg font-[900] text-[var(--brand)]">
              {course.author.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PR"}
            </span>
          )}
          <div>
            <p className="pr-eyebrow">About the Instructor</p>
            <h2 className="mt-2 text-[24px] font-[800] tracking-[-0.5px] text-[var(--ink)]">
              {course.author.name}
            </h2>
            {course.author.professionalTitle ? (
              <p className="mt-1 text-sm font-[800] text-[var(--brand)]">{course.author.professionalTitle}</p>
            ) : null}
            {course.author.bio ? (
              <p className="mt-3 max-w-3xl text-sm font-[500] leading-7 text-[var(--muted)]">{course.author.bio}</p>
            ) : null}
          </div>
        </Link>
      ) : null}

      {reviews.length > 0 ? (
        <section className="pr-card p-6 lg:p-7">
          <p className="pr-eyebrow">Reviews</p>
          <h2 className="pr-h2 mt-2">What learners say</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-[900] text-[var(--brand)]">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </p>
                {review.comment ? (
                  <p className="mt-2 text-sm font-[600] leading-6 text-[var(--ink-2)]">{review.comment}</p>
                ) : null}
                <p className="mt-3 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                  {review.user.name ?? review.user.email}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <CourseDiscussion courseId={course.id} threads={discussionThreads} canPost={enrolled} />
    </main>
  );
}
