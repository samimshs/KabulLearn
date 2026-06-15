"use client";

import Link from "next/link";
import Image from "next/image";
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
    isPaid?: boolean;
    priceCents?: number | null;
    currency?: string | null;
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
    instructors?: Array<{
      name: string;
      username: string;
      avatarUrl: string | null;
      professionalTitle: string | null;
      bio: string | null;
      linkedinUrl?: string | null;
      youtubeUrl?: string | null;
      userId?: string | null;
    }>;
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
  relatedCourses?: Array<{
    id: string;
    titleEn: string;
    titlePs: string;
    titleDa?: string | null;
    level?: string | null;
    enrollmentCount: number;
  }>;
  announcements?: Array<{
    id: string;
    body: string;
    createdAt: Date | string;
  }>;
  previewMode?: boolean;
  previewBackHref?: string;
};

const BASE_URL = "https://kabullearn.com";

function ShareButton({ courseId, title, t }: { courseId: string; title: string; t: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${BASE_URL}/courses/${encodeURIComponent(courseId)}`;
  const text = `${title} — KabulLearn`;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="pr-btn-ghost flex items-center gap-2"
        aria-label={t.shareCourse}
      >
        <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
          <circle cx="14" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="4" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="14" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 8l6-3M6 10l6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {t.shareCourse}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute start-0 top-[calc(100%+6px)] z-50 min-w-[200px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--card)] shadow-[0_8px_24px_rgba(10,9,20,0.12)]">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-[13px] font-[700] text-[var(--ink)] transition hover:bg-[var(--surface)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#25D366]" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t.shareViaWhatsApp}
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-[13px] font-[700] text-[var(--ink)] transition hover:bg-[var(--surface)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#229ED9]" fill="currentColor" aria-hidden="true">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              {t.shareViaTelegram}
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-[700] text-[var(--ink)] transition hover:bg-[var(--surface)]"
            >
              {copied ? (
                <svg viewBox="0 0 18 18" className="h-5 w-5 shrink-0 text-[var(--success)]" fill="none" aria-hidden="true">
                  <path d="M3 9l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 18 18" className="h-5 w-5 shrink-0 text-[var(--muted)]" fill="none" aria-hidden="true">
                  <rect x="6" y="6" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 6V4a1 1 0 00-1-1H4a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              {copied ? t.linkCopied : t.copyLink}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

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
  lessonStatuses = {},
  relatedCourses = [],
  announcements = [],
  previewMode = false,
  previewBackHref
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
  const [checkoutPending, setCheckoutPending] = useState(false);
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
  const priceLabel = course.isPaid && course.priceCents
    ? new Intl.NumberFormat(locale === "en" ? "en-US" : "fa-AF", {
        style: "currency",
        currency: (course.currency || "usd").toUpperCase()
      }).format(course.priceCents / 100)
    : null;
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
          setEnrollError(result.error ?? t.enrollErrorGeneric);
          return;
        }

        setEnrolled(true);
        router.refresh();
      } catch {
        setEnrollError(t.enrollErrorGeneric);
      }
    });
  }

  async function handlePaidCheckout() {
    setCheckoutPending(true);
    setEnrollError(null);

    try {
      const response = await fetch("/api/stripe/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id })
      });
      const result = (await response.json()) as { ok: boolean; error?: string; data?: { url?: string; enrolled?: boolean } };

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`);
        return;
      }

      if (!response.ok || !result.ok) {
        setEnrollError(result.error ?? t.enrollErrorGeneric);
        return;
      }

      if (result.data?.enrolled) {
        setEnrolled(true);
        router.refresh();
        return;
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setEnrollError(t.enrollErrorGeneric);
    } catch {
      setEnrollError(t.enrollErrorGeneric);
    } finally {
      setCheckoutPending(false);
    }
  }

  return (
    <main className="pr-page grid gap-6">
      <Link
        href={previewBackHref ?? "/courses"}
        className="inline-flex items-center gap-1.5 text-[13px] font-[800] uppercase tracking-[1px] text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
      >
        <span style={{ transform: direction === "rtl" ? "scaleX(-1)" : "none" }} aria-hidden="true">←</span>
        {previewMode ? "Back to editor" : t.backToCourses}
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
          <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
            {completedModules}/{totalModules} {t.modulesComplete}
          </span>
          {enrolled ? (
            <span className="rounded-full border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--success)]">
              {t.enrolled}
            </span>
          ) : null}
          {course.isPaid && priceLabel ? (
            <span className="rounded-full border border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] px-3 py-1 text-xs font-[900] uppercase tracking-[1px] text-[var(--brand)]">
              {priceLabel}
            </span>
          ) : (
            <span className="rounded-full border border-[rgba(24,130,92,0.18)] bg-[var(--success-50)] px-3 py-1 text-xs font-[900] uppercase tracking-[1px] text-[var(--success)]">
              {t.freeCourseLabel}
            </span>
          )}
          {ratingSummary && ratingSummary.count > 0 ? (
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-[900] uppercase tracking-[1px] text-[var(--ink)]">
              ★ {ratingSummary.average.toFixed(1)} ({ratingSummary.count})
            </span>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {previewMode ? (
            <span className="pr-btn-primary cursor-default opacity-80" aria-disabled="true">
              Student preview
            </span>
          ) : enrolled ? (
            resumeLessonId ? (
              <Link
                href={progressPercent >= 100 ? `/courses/${encodeURIComponent(course.id)}` : `/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(resumeLessonId)}${fromParam}`}
                className="pr-btn-primary"
              >
                {primaryActionLabel}
              </Link>
            ) : null
          ) : viewerId && course.isPaid ? (
            <button
              type="button"
              onClick={handlePaidCheckout}
              disabled={checkoutPending}
              className="pr-btn-primary"
              aria-label={t.buyCourse}
            >
              {checkoutPending ? "..." : `${t.buyCourse}${priceLabel ? ` · ${priceLabel}` : ""}`}
            </button>
          ) : viewerId ? (
            <button
              type="button"
              onClick={handleEnroll}
              disabled={isPending}
              className="pr-btn-primary"
              aria-label={t.enrollNow}
            >
              {isPending ? "..." : t.enrollNow}
            </button>
          ) : (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`}
              className="pr-btn-primary"
            >
              {course.isPaid ? t.buyCourse : t.enrollNow}
            </Link>
          )}
          {!previewMode ? (
            <ShareButton
              courseId={course.id}
              title={localize(locale, course.titleEn, course.titlePs, course.titleDa) ?? course.titleEn}
              t={t as Record<string, string>}
            />
          ) : null}
        </div>

        {enrollError ? (
          <p className="mt-3 rounded-[var(--radius)] border border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[800] text-[var(--danger)]" role="alert">{enrollError}</p>
        ) : null}
      </section>

      {enrolled && announcements.length > 0 ? (
        <section id="announcements" className="pr-card scroll-mt-24 p-6 lg:p-7">
          <p className="pr-eyebrow">{t.announceNavLabel}</p>
          <h2 className="pr-h2 mt-2">{t.notificationCenter}</h2>
          <div className="mt-5 grid gap-3">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="whitespace-pre-wrap text-sm font-[600] leading-7 text-[var(--ink-2)]">{announcement.body}</p>
                <p className="mt-3 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                  {new Date(announcement.createdAt).toLocaleDateString(locale === "en" ? "en-US" : `${locale}-AF`, {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">
                  {t.congratsFinishedCourse}
                </h2>
                <p className="mt-2 text-[15px] font-medium text-[var(--muted)]">
                  {t.yourGradeLabel} <strong className="font-bold text-[var(--ink)]">{certificateStatus.grade}%</strong>.{" "}
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
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-[var(--card)] px-4 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
        {(() => {
          // Compute the preview lesson ID (first non-quiz lesson of first module)
          const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);
          const firstMod = sortedModules[0];
          const previewLessonId = firstMod
            ? [...firstMod.lessons]
                .filter((l) => l.type !== "QUIZ")
                .sort((a, b) => a.order - b.order)[0]?.id ?? null
            : null;

          return course.modules.map((module, index) => {
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
                {module.lessons.map((lesson) => {
                  const isPreview = lesson.id === previewLessonId;
                  return (
                  <div key={lesson.id} className={`grid gap-2 rounded-[var(--radius)] border bg-[var(--card)] p-4 ${isPreview && !enrolled ? "border-[rgba(0,87,255,0.25)]" : "border-[var(--border)]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {enrolled ? <LessonStatusDot status={lessonStatuses[lesson.id]} /> : null}
                        <p className="truncate text-sm font-[800] text-[var(--ink-2)]">
                          {localize(locale, lesson.titleEn, lesson.titlePs, lesson.titleDa)}
                        </p>
                        {isPreview && !enrolled && (
                          <span className="shrink-0 rounded-full border border-[rgba(0,87,255,0.2)] bg-[rgba(0,87,255,0.06)] px-2 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] text-[var(--brand)]">
                            {t.freePreview}
                          </span>
                        )}
                      </div>
                      {previewMode ? (
                        <span className="shrink-0 text-xs font-[900] uppercase tracking-[1px] text-[var(--brand)]">
                          {isPreview ? t.preview : t.locked}
                        </span>
                      ) : enrolled && unlocked ? (
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
                      ) : !enrolled && isPreview ? (
                        <Link
                          href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}`}
                          className="shrink-0 text-sm font-[800] text-[var(--brand)] hover:underline"
                        >
                          {t.preview} →
                        </Link>
                      ) : !enrolled ? (
                        <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.enrollNow}</span>
                      ) : (
                        <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]" aria-label={t.locked}>
                          {t.locked}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </article>
          );
        });
        })()}
      </section>

      {(() => {
        // Prefer the ordered instructors array from the join table; fall back to legacy single author
        const instructorList =
          course.instructors && course.instructors.length > 0
            ? course.instructors
            : course.author
              ? [course.author]
              : [];

        if (instructorList.length === 0) return null;

        const isMultiple = instructorList.length > 1;
        const loginHref = `/login?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`;

        if (!isMultiple) {
          const instructor = instructorList[0];
          return (
            <section className="pr-card grid gap-5 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:p-7">
              <Link href={`/creators/${encodeURIComponent(instructor.username)}`} aria-label={instructor.name}>
                {instructor.avatarUrl ? (
                  <Image src={instructor.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-50)] text-lg font-[900] text-[var(--brand)]">
                    {instructor.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PR"}
                  </span>
                )}
              </Link>
              <div>
                <p className="pr-eyebrow">About the Instructor</p>
                <Link href={`/creators/${encodeURIComponent(instructor.username)}`} className="inline-block">
                  <h2 className="mt-2 text-[24px] font-[800] tracking-[-0.5px] text-[var(--ink)] transition hover:text-[var(--brand)]">
                    {instructor.name}
                  </h2>
                </Link>
                {instructor.professionalTitle ? (
                  <p className="mt-1 text-sm font-[800] text-[var(--brand)]">{instructor.professionalTitle}</p>
                ) : null}
                {instructor.bio ? (
                  <p className="mt-3 max-w-3xl text-sm font-[500] leading-7 text-[var(--muted)]">{instructor.bio}</p>
                ) : null}
              </div>
              <div className="shrink-0">
                <MessageInstructorButton
                  instructorUserId={instructor.userId ?? instructorUserId}
                  instructorName={instructor.name}
                  viewerId={viewerId}
                  viewerRole={viewerRole}
                  loginHref={loginHref}
                  variant="ghost"
                />
              </div>
            </section>
          );
        }

        return (
          <section className="pr-card p-6 lg:p-7">
            <p className="pr-eyebrow">About the Instructors</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {instructorList.map((instructor) => (
                <article
                  key={instructor.username}
                  className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div className="flex items-center gap-4">
                    <Link href={`/creators/${encodeURIComponent(instructor.username)}`} aria-label={instructor.name} className="shrink-0">
                      {instructor.avatarUrl ? (
                        <Image src={instructor.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--brand-50)] text-base font-[900] text-[var(--brand)]">
                          {instructor.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PR"}
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/creators/${encodeURIComponent(instructor.username)}`} className="inline-block">
                        <h2 className="text-[17px] font-[800] tracking-[-0.3px] text-[var(--ink)] transition hover:text-[var(--brand)]">
                          {instructor.name}
                        </h2>
                      </Link>
                      {instructor.professionalTitle ? (
                        <p className="mt-0.5 truncate text-sm font-[700] text-[var(--brand)]">{instructor.professionalTitle}</p>
                      ) : null}
                    </div>
                  </div>
                  {instructor.bio ? (
                    <p className="line-clamp-4 text-sm font-[500] leading-6 text-[var(--muted)]">{instructor.bio}</p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-3 pt-1">
                    <Link
                      href={`/creators/${encodeURIComponent(instructor.username)}`}
                      className="text-[12px] font-[800] uppercase tracking-[1px] text-[var(--muted)] transition hover:text-[var(--brand)]"
                    >
                      View profile →
                    </Link>
                    {instructor.userId ? (
                      <MessageInstructorButton
                        instructorUserId={instructor.userId}
                        instructorName={instructor.name}
                        viewerId={viewerId}
                        viewerRole={viewerRole}
                        loginHref={loginHref}
                        variant="ghost"
                      />
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })()}

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

      {relatedCourses.length > 0 ? (
        <section className="pr-card p-6 lg:p-7">
          <p className="pr-eyebrow">{t.studentsAlsoEnrolled}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedCourses.map((rc) => (
              <Link
                key={rc.id}
                href={`/courses/${encodeURIComponent(rc.id)}`}
                className="group flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[rgba(0,87,255,0.3)] hover:shadow-[var(--shadow-sm)]"
              >
                <p className="line-clamp-2 text-[14px] font-[800] leading-snug text-[var(--ink)] group-hover:text-[var(--brand)]">
                  {localize(locale, rc.titleEn, rc.titlePs, rc.titleDa)}
                </p>
                <div className="flex items-center gap-3 text-[12px] text-[var(--muted)]">
                  {rc.level ? (
                    <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 font-[700]">{localizeLevel(rc.level, locale)}</span>
                  ) : null}
                  <span>{rc.enrollmentCount} {t.enrolledStudents}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <CourseDiscussion courseId={course.id} threads={discussionThreads} canPost={enrolled} />
    </main>
  );
}
