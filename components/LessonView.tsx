"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { getPassedQuizzes, isModuleUnlocked, markLessonVisited } from "@/lib/progress";
import { usesPashtoContent } from "@/lib/i18n";
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
  isComplete?: boolean;
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
export function LessonView({ course, lesson, serverPassedModuleIds = [], isComplete = false }: LessonViewProps) {
  const { locale, t, direction } = useLanguage();
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    markLessonVisited(course.id, lesson.id);
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
              href={`/courses/${encodeURIComponent(course.id)}`}
              className="flex items-center gap-1.5 text-[12px] font-[800] uppercase tracking-[1px] text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
            >
              <span style={{ transform: direction === "rtl" ? "scaleX(-1)" : "none" }}>
                <IconArrowLeft />
              </span>
              {t.backToCourses}
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
                              className="flex items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[600] text-[var(--muted-2)]"
                            >
                              <span className="opacity-50">{getLessonIcon(ml)}</span>
                              <span className="truncate opacity-50">{label}</span>
                            </span>
                          );
                        }

                        return (
                          <Link
                            key={ml.id}
                            href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(ml.id)}`}
                            className={`flex items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[700] transition ${
                              active
                                ? "bg-[var(--brand)] text-white shadow-sm"
                                : "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                            }`}
                          >
                            <span className={active ? "text-white/80" : "text-[var(--muted)]"}>
                              {getLessonIcon(ml)}
                            </span>
                            <span className="truncate">{label}</span>
                          </Link>
                        );
                      })}

                      {/* Required quiz entry */}
                      {unlocked && (
                        <Link
                          href={`/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(module.id)}`}
                          className={`flex items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[800] transition ${
                            quizPassed
                              ? "bg-[var(--success-50)] text-[var(--success)]"
                              : isCurrentModule
                                ? "bg-[var(--warning-50)] text-[var(--warning)]"
                                : "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                          }`}
                        >
                          <span>{quizPassed ? <IconCheck /> : <IconQuiz />}</span>
                          <span className="truncate">{t.requiredQuiz}</span>
                          {quizPassed && (
                            <span className="ms-auto text-[10px] font-[800] uppercase tracking-wider opacity-70">
                              {t.completed}
                            </span>
                          )}
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

        {/* Hero panel */}
        <div className="pr-panel p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="pr-eyebrow">{t.currentLesson}</p>
            {lesson.isFinalTest && (
              <span className="pr-badge pr-badge-gold">{t.requiredQuiz}</span>
            )}
            {isVideoLesson(lesson) ? (
              <span className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                <IconVideo /> {t.video}
              </span>
            ) : null}
            {isReadingLesson(lesson) ? (
              <span className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                <IconReading /> {t.reading}
              </span>
            ) : null}
          </div>

          <h1 className="pr-h1 mt-3">{lessonTitle}</h1>

          {lessonDescription && (
            <p className="pr-copy mt-4 max-w-2xl">{lessonDescription}</p>
          )}

          {/* Navigation */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {previousLesson && (
              <Link
                href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(previousLesson.id)}`}
                className="pr-btn-ghost"
              >
                {t.previousLesson}
              </Link>
            )}
            {nextLessonInModule ? (
              <Link
                href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(nextLessonInModule.id)}`}
                className="pr-btn-primary"
              >
                {t.nextLesson}
              </Link>
            ) : (
              <Link href={quizHref} className="pr-btn-primary">
                {t.nextRequiredQuiz}
              </Link>
            )}
          </div>
        </div>

        {/* Video */}
        {isVideoLesson(lesson) ? (
          <section id="video" className="scroll-mt-24 overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
            <VideoPlayer video={lesson.youtubeUrl!} courseId={course.id} lessonId={lesson.id} />
          </section>
        ) : null}

        {/* Reading content — only rendered when there is actual markdown */}
        {isReadingLesson(lesson) && lessonContent ? (
          <article id="content" className="pr-card scroll-mt-24 p-6 lg:p-8">
            <h2 className="text-[18px] font-[800] tracking-tight text-[var(--ink-2)]">{t.lessonContent}</h2>
            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <SimpleMarkdown content={lessonContent} />
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
