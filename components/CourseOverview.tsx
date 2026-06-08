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
import { MessageInstructorButton } from "@/components/MessageInstructorButton";
import { CertificatePreview } from "@/components/CertificatePreview";
import type { Course, Lesson, Module } from "@prisma/client";

type CourseModule = Pick<Module, "id" | "order" | "titleEn" | "titlePs"> & {
  titleDa?: string | null;
  lessons: Array<Pick<Lesson, "id" | "order" | "type" | "titleEn" | "titlePs"> & { titleDa?: string | null }>;
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
      userId?: string | null;
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
  instructorUserId?: string | null;
  viewerId?: string | null;
  viewerRole?: string | null;
  studentName?: string;
  lessonStatuses?: Record<string, "IN_PROGRESS" | "COMPLETED">;
};

/* Khan Academy-style status dot for the course-overview lesson list */
function LessonStatusDot({ status }: { status: "IN_PROGRESS" | "COMPLETED" | undefined }) {
  if (status === "COMPLETED") {
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[var(--success)] text-white" aria-label="Completed">
        <svg viewBox="0 0 14 14" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
          <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#FFF4DE] ring-1 ring-[#F2C879]" aria-label="In progress">
        <span className="h-2 w-2 rounded-full bg-[#D97706]" />
      </span>
    );
  }
  return (
    <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[var(--border)]" aria-label="Not started" />
  );
}

export function CourseOverview({
  course,
  serverPassedModuleIds = [],
  certificateStatus,
  isEnrolled = false,
  userRating,
  ratingSummary,
  reviews = [],
  progressPercent = 0,
  discussionThreads = [],
  instructorUserId = null,
  viewerId = null,
  viewerRole = null,
  studentName = "",
  lessonStatuses = {}
}: CourseOverviewProps) {
  const { locale, t, direction } = useLanguage();
  const router = useRouter();
  // Preserve ?from=my-courses so the lesson page knows where to send the back button
  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const fromParam = searchParams?.get("from") === "my-courses" ? "?from=my-courses" : "";
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set(serverPassedModuleIds));
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resumeLessonId, setResumeLessonId] = useState<string | null>(null);
  const [hasVisitedAny, setHasVisitedAny] = useState(false);
  const moduleIds = course.modules.map((module) => module.id);
  const totalModules = course.modules.length;
  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  useEffect(() => {
    const localPassed = getPassedQuizzes(course.id, moduleIds);
    setPassedQuizzes(new Set([...localPassed, ...serverPassedModuleIds]));
    const lastVisited = getResumeLessonId(course.id, allLessonIds);
    setHasVisitedAny(lastVisited !== null);
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
    progressPercent >= 100
      ? t.viewCourse
      : (progressPercent > 0 || hasVisitedAny)
        ? t.continueLesson
        : t.startLearning;

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
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-[13px] font-[800] uppercase tracking-[1px] text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
      >
        <span style={{ transform: direction === "rtl" ? "scaleX(-1)" : "none" }} aria-hidden="true">←</span>
        {t.backToCourses}
      </Link>

      <section className="pr-panel p-5 lg:p-7">
        <p className="pr-eyebrow">{t.courses}</p>
        <h1 className="mt-2 text-[clamp(20px,2.2vw,30px)] font-[800] leading-snug tracking-[-0.5px] text-[var(--ink)]">
          {localize(locale, course.titleEn, course.titlePs, course.titleDa)}
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] font-[500] leading-relaxed text-[var(--muted)]">
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
                href={progressPercent >= 100 ? `/courses/${encodeURIComponent(course.id)}` : `/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(resumeLessonId)}${fromParam}`}
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

      {/* ── Course completion dashboard ─────────────────────────── */}
      {enrolled && certificateStatus?.eligible ? (
        <section className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-6 lg:p-8">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">

            {/* Left column — message + rating (7/12) */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                  {t.courseCompleteEyebrow}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {t.congratsFinishedCourse}
                </h2>
                <p className="mt-2 text-[15px] font-medium text-slate-500">
                  {t.yourGradeLabel} <strong className="font-bold text-slate-900">{certificateStatus.grade}%</strong>.{" "}
                  {t.certReadyPreviewHint}
                </p>
              </div>

              <CourseRatingForm
                courseId={course.id}
                initialRating={userRating?.rating}
                initialComment={userRating?.comment}
              />
            </div>

            {/* Right column — certificate preview + actions (5/12), bottom-aligned with the rating card */}
            <div className="flex flex-col justify-end lg:col-span-5">
              <div className="mx-auto w-full max-w-sm">
                <Link
                  href={`/courses/${encodeURIComponent(course.id)}/certificate`}
                  aria-label="View full certificate"
                  className="block rounded-xl shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <CertificatePreview
                    courseTitle={localize(locale, course.titleEn, course.titlePs, course.titleDa)}
                    studentName={studentName || "Your Name"}
                    grade={certificateStatus.grade ?? 100}
                  />
                </Link>

                {/* Actions under the preview — unified emerald scale */}
                <div className="mt-4 flex gap-3">
                  <a
                    href={`/courses/${encodeURIComponent(course.id)}/certificate/download`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download PDF
                  </a>
                  <Link
                    href={`/courses/${encodeURIComponent(course.id)}/certificate`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    View full
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
                      <div className="flex min-w-0 items-center gap-2.5">
                        {enrolled ? <LessonStatusDot status={lessonStatuses[lesson.id]} /> : null}
                        <p className="truncate text-sm font-[800] text-[var(--ink-2)]">
                          {localize(locale, lesson.titleEn, lesson.titlePs, lesson.titleDa)}
                        </p>
                      </div>
                      {enrolled && unlocked ? (
                        <Link
                          href={
                            lesson.type === "QUIZ"
                              ? `/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(module.id)}`
                              : `/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}`
                          }
                          className="text-sm font-[800] text-[var(--brand)] hover:underline"
                          aria-label={`${lesson.type === "QUIZ" ? t.testYourSkills : t.continueLesson}: ${localize(locale, lesson.titleEn, lesson.titlePs, lesson.titleDa)}`}
                        >
                          {lesson.type === "QUIZ" ? t.testYourSkills : t.continueLesson}
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
        <section className="pr-card grid gap-5 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:p-7">
          <Link href={`/creators/${encodeURIComponent(course.author.username)}`} aria-label={course.author.name}>
            {course.author.avatarUrl ? (
              <img src={course.author.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-50)] text-lg font-[900] text-[var(--brand)]">
                {course.author.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PR"}
              </span>
            )}
          </Link>
          <div>
            <p className="pr-eyebrow">About the Instructor</p>
            <Link href={`/creators/${encodeURIComponent(course.author.username)}`} className="inline-block">
              <h2 className="mt-2 text-[24px] font-[800] tracking-[-0.5px] text-[var(--ink)] transition hover:text-[var(--brand)]">
                {course.author.name}
              </h2>
            </Link>
            {course.author.professionalTitle ? (
              <p className="mt-1 text-sm font-[800] text-[var(--brand)]">{course.author.professionalTitle}</p>
            ) : null}
            {course.author.bio ? (
              <p className="mt-3 max-w-3xl text-sm font-[500] leading-7 text-[var(--muted)]">{course.author.bio}</p>
            ) : null}
          </div>
          <div className="shrink-0">
            <MessageInstructorButton
              instructorUserId={instructorUserId}
              instructorName={course.author.name}
              viewerId={viewerId}
              viewerRole={viewerRole}
              loginHref={`/login?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`}
              variant="ghost"
            />
          </div>
        </section>
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
