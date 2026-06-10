"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { getPassedQuizzes, isModuleUnlocked, markLessonVisited } from "@/lib/progress";
import { usesPashtoContent } from "@/lib/i18n";
import { completeReadingLesson, markLessonInProgress } from "@/lib/actions/video-actions";
import { LessonStateIcon, lessonKindOf, type LessonState } from "@/components/LessonStateIcon";
import type { Course, Lesson, Module } from "@prisma/client";

type LessonCourse = Pick<
  Lesson,
  | "id" | "moduleId" | "order" | "type"
  | "titleEn" | "titlePs"
  | "descriptionEn" | "descriptionPs"
  | "youtubeUrl" | "readingEn" | "readingPs"
  | "isFinalTest" | "passingScore"
>;

type CourseModule = Pick<Module, "id" | "order" | "titleEn" | "titlePs"> & {
  lessons: LessonCourse[];
};

type CourseWithLessons = Pick<
  Course,
  "id" | "titleEn" | "titlePs" | "descriptionEn" | "descriptionPs" | "level"
> & {
  modules: CourseModule[];
};

type LessonViewProps = {
  course: CourseWithLessons;
  lesson: LessonCourse;
  serverPassedModuleIds?: string[];
  lessonStatuses?: Record<string, "IN_PROGRESS" | "COMPLETED">;
  isComplete?: boolean;
  isPreviewLesson?: boolean;
};

/* ── Inline icons ──────────────────────────────────────────── */
const IconVideo = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M11 6.5l4-2v7l-4-2V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const IconReading = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 3.25c2.05-.6 3.87-.28 5.5.95v10c-1.63-1.23-3.45-1.55-5.5-.95Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 4.2c1.63-1.23 3.45-1.55 5.5-.95v10c-2.05-.6-3.87-.28-5.5.95Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 4.2v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconQuiz = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6.25 6.1a2 2 0 0 1 3.55 1.25c0 1.7-1.8 1.72-1.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12.25h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function isVideoLesson(lesson: LessonCourse) {
  return lesson.type === "VIDEO" && Boolean(lesson.youtubeUrl);
}

function isReadingLesson(lesson: LessonCourse) {
  return lesson.type === "READING" || (!lesson.youtubeUrl && Boolean(lesson.readingEn || lesson.readingPs));
}

function getLessonIcon(lesson: LessonCourse) {
  if (isReadingLesson(lesson)) return <IconReading />;
  if (lesson.type === "QUIZ") return <IconQuiz />;
  return <IconVideo />;
}


/* ── Component ─────────────────────────────────────────────── */
export function LessonView({ course, lesson, serverPassedModuleIds = [], lessonStatuses = {}, isComplete = false, isPreviewLesson = false }: LessonViewProps) {
  const { locale, t, direction } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPortal = searchParams.get("from") === "my-courses";
  const fromParam = fromPortal ? "?from=my-courses" : "";
  const backHref = fromPortal ? "/dashboard/my-courses" : `/courses/${encodeURIComponent(course.id)}`;
  const backLabel = fromPortal ? t.myCourses : t.backToCourse;
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, "IN_PROGRESS" | "COMPLETED">>(lessonStatuses);
  const [readingDone, setReadingDone] = useState(false);
  const [isPendingComplete, startCompleteTransition] = useTransition();

  // Resolve the visual state of any lesson in the sidebar
  const stateOf = (id: string): LessonState => {
    const s = statuses[id];
    if (s === "COMPLETED") return "completed";
    if (s === "IN_PROGRESS") return "in_progress";
    if (id === lesson.id) return "in_progress"; // the lesson being viewed is at least in progress
    return "not_started";
  };

  const moduleIds = course.modules.map(m => m.id);
  const lessonSequence = course.modules.flatMap(m =>
    m.lessons.map(l => ({ ...l, moduleId: m.id, moduleTitleEn: m.titleEn, moduleTitlePs: m.titlePs }))
  );
  const lessonIndex = lessonSequence.findIndex(l => l.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? lessonSequence[lessonIndex - 1] : null;
  const moduleIndex = course.modules.findIndex(m => m.id === lesson.moduleId);
  const currentModule = moduleIndex >= 0 ? course.modules[moduleIndex] : null;
  const lessonIndexInModule = currentModule?.lessons.findIndex(l => l.id === lesson.id) ?? -1;
  const nextLessonInModule =
    currentModule && lessonIndexInModule >= 0 && lessonIndexInModule < currentModule.lessons.length - 1
      ? currentModule.lessons[lessonIndexInModule + 1]
      : null;
  const quizHref = currentModule
    ? `/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(currentModule.id)}`
    : "/";
  const moduleUnlocked = isComplete || (moduleIndex >= 0 ? isModuleUnlocked(moduleIndex, moduleIds, passedQuizzes) : false);
  const lessonTitle = usesPashtoContent(locale) ? lesson.titlePs : lesson.titleEn;
  const lessonDescription = usesPashtoContent(locale) ? lesson.descriptionPs ?? "" : lesson.descriptionEn ?? "";
  const lessonContent = usesPashtoContent(locale) ? lesson.readingPs : lesson.readingEn;
  const courseTitle = usesPashtoContent(locale) ? course.titlePs : course.titleEn;

  useEffect(() => {
    const localPassed = getPassedQuizzes(course.id, moduleIds);
    setPassedQuizzes(new Set([...localPassed, ...serverPassedModuleIds]));
  }, [course.id, moduleIds.join("|"), serverPassedModuleIds.join("|")]);

  // On open: record visit (resume) + mark IN_PROGRESS server-side, and reflect it instantly.
  useEffect(() => {
    markLessonVisited(course.id, lesson.id);
    markLessonInProgress({ courseId: course.id, lessonId: lesson.id }).catch(() => {});
    setStatuses(() => {
      const next: Record<string, "IN_PROGRESS" | "COMPLETED"> = { ...lessonStatuses };
      if (next[lesson.id] !== "COMPLETED") next[lesson.id] = "IN_PROGRESS";
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, lesson.id]);

  if (!lesson) {
    return (
      <main className="pr-page grid min-h-[70vh] place-items-center">
        <div className="pr-card max-w-lg p-8 text-center">
          <h1 className="pr-h2">{t.notFound}</h1>
          <Link href="/" className="pr-btn-primary mt-5">{t.backToCourses}</Link>
        </div>
      </main>
    );
  }

  if (!moduleUnlocked) {
    return (
      <main className="pr-page grid min-h-[70vh] place-items-center">
        <div className="pr-card max-w-lg p-8 text-center">
          <p className="pr-eyebrow text-[var(--danger)]">{t.locked}</p>
          <h1 className="pr-h2 mt-3">{lessonTitle}</h1>
          <p className="pr-copy mt-4">{t.lockedUntilQuiz}</p>
          <Link href="/" className="pr-btn-primary mt-5">{t.backToCourses}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pr-page grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="order-2 lg:order-1 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

          {/* Course header */}
          <div className="border-b border-[var(--border)] p-4">
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-[12px] font-[800] uppercase tracking-[1px] text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
            >
              <span style={{ transform: direction === "rtl" ? "scaleX(-1)" : "none" }}>
                <IconArrowLeft />
              </span>
              {backLabel}
            </Link>
            <h2 className="mt-3 text-[16px] font-[800] leading-snug tracking-tight text-[var(--ink)]">{courseTitle}</h2>
            <p className="mt-1 text-[12px] font-[600] text-[var(--muted)]">{t.courseNavigation}</p>
          </div>

          {/* Module navigation */}
          <nav className="p-3">
            <div className="grid gap-4">
              {course.modules.map((module) => {
                const mIdx = course.modules.findIndex(m => m.id === module.id);
                const unlocked = isComplete || isModuleUnlocked(mIdx, moduleIds, passedQuizzes);
                const moduleTitle = usesPashtoContent(locale) ? module.titlePs : module.titleEn;
                const quizPassed = passedQuizzes.has(module.id);
                const isCurrentModule = module.id === currentModule?.id;

                return (
                  <section key={module.id}>
                    {/* Module label */}
                    <div className="mb-1 flex items-center gap-2 px-2">
                      {!unlocked && <IconLock />}
                      <h3 className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)] truncate">
                        {moduleTitle}
                      </h3>
                    </div>

                    {/* Lesson list */}
                    <div className="grid gap-0.5">
                      {module.lessons.filter(ml => ml.type !== "QUIZ").map((ml) => {
                        const active = ml.id === lesson.id;
                        const label = usesPashtoContent(locale) ? ml.titlePs : ml.titleEn;

                        if (!unlocked) {
                          return (
                            <span
                              key={ml.id}
                              className="flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[600] text-[var(--muted-2)]"
                            >
                              <span className="opacity-50"><LessonStateIcon state="not_started" kind={lessonKindOf(ml)} /></span>
                              <span className="truncate opacity-50">{label}</span>
                            </span>
                          );
                        }

                        const lessonState = stateOf(ml.id);
                        return (
                          <Link
                            key={ml.id}
                            href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(ml.id)}${fromParam}`}
                            className={`flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[700] transition ${
                              active
                                ? "bg-[var(--brand)] text-white shadow-sm"
                                : lessonState === "completed"
                                  ? "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                                  : "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                            }`}
                          >
                            <LessonStateIcon state={lessonState} kind={lessonKindOf(ml)} />
                            <span className="truncate">{label}</span>
                          </Link>
                        );
                      })}

                      {/* Required quiz entry */}
                      {unlocked && (
                        <Link
                          href={`/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(module.id)}`}
                          className={`flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[800] transition ${
                            quizPassed
                              ? "bg-[var(--success-50)] text-[var(--success)]"
                              : isCurrentModule
                                ? "bg-[var(--warning-50)] text-[var(--warning)]"
                                : "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                          }`}
                        >
                          <LessonStateIcon
                            state={quizPassed ? "completed" : isCurrentModule ? "in_progress" : "not_started"}
                            kind="quiz"
                          />
                          <span className="truncate">{t.requiredQuiz}</span>
                        </Link>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <section className="order-1 grid min-w-0 auto-rows-min gap-5 lg:order-2">

        {/* Preview enrollment banner */}
        {isPreviewLesson && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[rgba(0,87,255,0.2)] bg-[rgba(0,87,255,0.04)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-white">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8 5v4m0 2h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-[13px] font-[800] text-[var(--ink)]">Free Preview</p>
                <p className="text-[12px] font-[600] text-[var(--muted)]">Enroll to unlock all lessons and track your progress.</p>
              </div>
            </div>
            <Link
              href={`/courses/${encodeURIComponent(course.id)}`}
              className="pr-btn-primary shrink-0 !min-h-9 px-5 text-[13px]"
            >
              Enroll for free →
            </Link>
          </div>
        )}

        {/* Compact lesson header card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] lg:p-5">
          {/* Type + badge */}
          <div className="flex flex-wrap items-center gap-2">
            {isVideoLesson(lesson) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                <IconVideo /> {t.video}
              </span>
            ) : null}
            {isReadingLesson(lesson) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                <IconReading /> {t.reading}
              </span>
            ) : null}
            {lesson.isFinalTest && <span className="pr-badge pr-badge-gold">{t.requiredQuiz}</span>}
          </div>

          <h1 className="mt-3 text-[clamp(18px,1.9vw,25px)] font-[800] leading-snug tracking-[-0.4px] text-[var(--ink)]">
            {lessonTitle}
          </h1>
          {lessonDescription && (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)]">{lessonDescription}</p>
          )}
        </div>

        {/* Video */}
        {isVideoLesson(lesson) ? (
          <section id="video" className="scroll-mt-24 overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
            <VideoPlayer
              video={lesson.youtubeUrl!}
              courseId={course.id}
              lessonId={lesson.id}
              initialCompleted={statuses[lesson.id] === "COMPLETED"}
              onComplete={() => {
                setStatuses((prev) => ({ ...prev, [lesson.id]: "COMPLETED" }));
                router.refresh();
              }}
            />
          </section>
        ) : null}

        {/* Reading content — only rendered when there is actual markdown */}
        {isReadingLesson(lesson) && lessonContent ? (
          <article id="content" className="pr-card scroll-mt-24 p-6 lg:p-8">
            <h2 className="text-[18px] font-[800] tracking-tight text-[var(--ink-2)]">{t.lessonContent}</h2>
            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <SimpleMarkdown content={lessonContent} />
            </div>

            {/* Mark as Complete */}
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              {readingDone ? (
                <div className="flex items-center gap-2 text-[14px] font-[800] text-[var(--success)]">
                  <IconCheck />
                  {t.lessonCompleteProgressSaved}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPendingComplete}
                  onClick={() => {
                    startCompleteTransition(async () => {
                      await completeReadingLesson({ courseId: course.id, lessonId: lesson.id });
                      setStatuses((prev) => ({ ...prev, [lesson.id]: "COMPLETED" }));
                      setReadingDone(true);
                      router.refresh();
                    });
                  }}
                  className="pr-btn-primary"
                >
                  {isPendingComplete ? t.savingLabel : t.markAsComplete}
                </button>
              )}
            </div>
          </article>
        ) : null}

        {/* Navigation footer — right below the content, no scrolling back up */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
          {previousLesson ? (
            <Link
              href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(previousLesson.id)}${fromParam}`}
              className="pr-btn-ghost !min-h-10 px-4 text-[13px]"
            >
              {t.previousLesson}
            </Link>
          ) : (
            <span />
          )}
          {nextLessonInModule ? (
            <Link
              href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(nextLessonInModule.id)}${fromParam}`}
              className="pr-btn-primary !min-h-10 px-5 text-[13px]"
            >
              {t.nextLesson}
            </Link>
          ) : (
            <Link href={`${quizHref}${fromParam}`} className="pr-btn-primary !min-h-10 px-5 text-[13px]">
              {t.nextRequiredQuiz}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
