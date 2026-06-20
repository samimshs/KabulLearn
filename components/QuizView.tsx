"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuizBlock } from "@/components/QuizBlock";
import { useLanguage } from "@/components/LanguageProvider";
import { getPassedQuizzes, quizProgressKey } from "@/lib/progress";
import { startQuizAttempt, submitQuizAttempt, getQuizAttemptStatus } from "@/lib/actions/quiz-actions";
import { LessonStateIcon, lessonKindOf, type LessonState } from "@/components/LessonStateIcon";
import { usesPashtoContent, type Locale, type Dictionary } from "@/lib/i18n";
import { type Course, type Module, type Lesson, type Question, type AnswerChoice } from "@prisma/client";

type QuizChoice = Pick<AnswerChoice, "id" | "textEn" | "textPs" | "isCorrect" | "order"> & { textDa?: string | null };

type QuizQuestion = Pick<Question, "id" | "promptEn" | "promptPs" | "correctAnswer" | "explanationEn" | "explanationPs" | "order" | "type"> & {
  promptDa?: string | null;
  explanationDa?: string | null;
  choices: QuizChoice[];
};

type LessonCourse = Pick<
  Lesson,
  | "id" | "moduleId" | "order" | "type"
  | "titleEn" | "titlePs"
  | "descriptionEn" | "descriptionPs"
  | "youtubeUrl" | "readingEn" | "readingPs"
  | "isFinalTest" | "passingScore"
> & {
  quiz?: { id: string; lessonId: string; questions: QuizQuestion[] } | null;
};

type CourseModule = Pick<Module, "id" | "order" | "titleEn" | "titlePs" | "descriptionEn" | "descriptionPs"> & {
  lessons: LessonCourse[];
};

type CourseWithModules = Pick<
  Course,
  "id" | "titleEn" | "titlePs" | "descriptionEn" | "descriptionPs" | "level"
> & {
  modules: CourseModule[];
};

type QuizViewProps = {
  course: CourseWithModules;
  module: CourseModule;
  serverPassedModuleIds?: string[];
  lessonStatuses?: Record<string, "IN_PROGRESS" | "COMPLETED">;
  isComplete?: boolean;
  previousScore?: number | null;
  attemptStatus?: { attemptsUsed: number; retryAt: string | null };
};

/* ── Icons ─────────────────────────────────────────────────── */
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

const IconArrowLeft = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function isReadingLesson(lesson: LessonCourse) {
  return lesson.type === "READING" || (!lesson.youtubeUrl && Boolean(lesson.readingEn || lesson.readingPs));
}

function getLessonIcon(lesson: LessonCourse) {
  if (isReadingLesson(lesson)) return <IconReading />;
  if (lesson.type === "QUIZ") return <IconQuiz />;
  return <IconVideo />;
}

/* ── Shared sidebar ─────────────────────────────────────────── */
function CourseSidebar({
  course,
  module,
  passedQuizzes,
  lessonStatuses,
  locale,
  t,
  direction,
}: {
  course: CourseWithModules;
  module: CourseModule;
  passedQuizzes: Set<string>;
  lessonStatuses: Record<string, "IN_PROGRESS" | "COMPLETED">;
  locale: Locale;
  t: Dictionary;
  direction: "ltr" | "rtl";
}) {
  const courseTitle = usesPashtoContent(locale) ? course.titlePs : course.titleEn;
  const contentLessonState = (id: string): LessonState => {
    const s = lessonStatuses[id];
    if (s === "COMPLETED") return "completed";
    if (s === "IN_PROGRESS") return "in_progress";
    return "not_started";
  };

  return (
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
            {t.backToCourse}
          </Link>
          <h2 className="mt-3 text-[16px] font-[800] leading-snug tracking-tight text-[var(--ink)]">{courseTitle}</h2>
          <p className="mt-1 text-[12px] font-[600] text-[var(--muted)]">{t.courseNavigation}</p>
        </div>

        {/* Module navigation */}
        <nav className="p-3">
          <div className="grid gap-4">
            {course.modules.map((mod) => {
              const modTitle = usesPashtoContent(locale) ? mod.titlePs : mod.titleEn;
              const isCurrentModule = mod.id === module.id;
              const quizPassed = passedQuizzes.has(mod.id);

              return (
                <section key={mod.id}>
                  <div className="mb-1 px-2">
                    <h3 className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)] truncate">
                      {modTitle}
                    </h3>
                  </div>

                  <div className="grid gap-0.5">
                    {mod.lessons.filter(lesson => lesson.type !== "QUIZ").map((lesson) => {
                      const label = usesPashtoContent(locale) ? lesson.titlePs : lesson.titleEn;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}`}
                          className="flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[700] text-[var(--ink-2)] transition hover:bg-[var(--surface)]"
                        >
                          <LessonStateIcon state={contentLessonState(lesson.id)} kind={lessonKindOf(lesson)} />
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}

                    {/* Required quiz link */}
                    <Link
                      href={`/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(mod.id)}`}
                      className={`flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[800] transition ${
                        isCurrentModule
                          ? "bg-[var(--brand)] text-white shadow-sm"
                          : quizPassed
                            ? "bg-[var(--success-50)] text-[var(--success)]"
                            : "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <LessonStateIcon
                        state={quizPassed ? "completed" : isCurrentModule ? "in_progress" : "not_started"}
                        kind="quiz"
                      />
                      <span className="truncate">{t.requiredQuiz}</span>
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export function QuizView({
  course,
  module,
  serverPassedModuleIds = [],
  lessonStatuses = {},
  isComplete = false,
  previousScore = null,
  attemptStatus,
}: QuizViewProps) {
  const { locale, t, direction } = useLanguage();
  const router = useRouter();
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set(serverPassedModuleIds));
  const [retaking, setRetaking] = useState(false);
  const [justPassed, setJustPassed] = useState(false);
  const [liveAttemptsUsed, setLiveAttemptsUsed] = useState(attemptStatus?.attemptsUsed ?? 0);
  const [liveRetryAt, setLiveRetryAt] = useState<string | null>(attemptStatus?.retryAt ?? null);

  const moduleIds = course.modules.map((m) => m.id);
  const moduleIndex = course.modules.findIndex((m) => m.id === module.id);
  const nextModule = course.modules[moduleIndex + 1];
  const previousLesson = module.lessons[module.lessons.length - 1];
  const nextLesson = nextModule?.lessons[0];
  const passed = passedQuizzes.has(module.id);
  const quizLesson = module.lessons.find((l) => (l.quiz?.questions?.length ?? 0) > 0) ?? module.lessons.at(-1);

  useEffect(() => {
    const localPassed = getPassedQuizzes(course.id, moduleIds);
    setPassedQuizzes(new Set([...localPassed, ...serverPassedModuleIds]));
  }, [course.id, moduleIds.join("|"), serverPassedModuleIds.join("|")]);

  const sidebarProps = { course, module, passedQuizzes, lessonStatuses, locale, t, direction };

  if (!quizLesson || !quizLesson.quiz?.questions?.length) {
    return (
      <main className="pr-page grid min-h-[70vh] place-items-center">
        <div className="pr-card max-w-lg p-8 text-center">
          <h1 className="pr-h2">{t.notFound}</h1>
          <Link href="/" className="pr-btn-primary mt-5">{t.backToCourses}</Link>
        </div>
      </main>
    );
  }

  const quiz = quizLesson.quiz;
  const quizTitle = usesPashtoContent(locale) ? quizLesson.titlePs : quizLesson.titleEn;
  const quizDesc = usesPashtoContent(locale) ? quizLesson.descriptionPs ?? "" : quizLesson.descriptionEn ?? "";
  const passingScore = quizLesson.passingScore ?? 70;
  const isPashto = usesPashtoContent(locale);

  const reviewQuestions = quiz?.questions.map((q) => {
    const qAny = q as Record<string, unknown>;
    return {
      id: q.id,
      type: q.type,
      prompt: isPashto ? q.promptPs : (qAny.promptDa as string | null) ?? q.promptEn,
      correctAnswer: q.correctAnswer ?? null,
      explanation: q.explanationEn || q.explanationPs
        ? (isPashto ? q.explanationPs : (qAny.explanationDa as string | null) ?? q.explanationEn) ?? null
        : null,
      choices: q.choices.map((c) => {
        const cAny = c as Record<string, unknown>;
        return {
          id: c.id,
          text: isPashto ? c.textPs : (cAny.textDa as string | null) ?? c.textEn,
          isCorrect: c.isCorrect,
        };
      }),
    };
  }) ?? [];

  /* ── Previously-passed state ──────────────────────────────── */
  if (previousScore !== null && !retaking && !justPassed) {
    const didPass = previousScore >= passingScore;

    return (
      <main className="pr-page grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <CourseSidebar {...sidebarProps} />

        <section className="order-1 grid min-w-0 auto-rows-min gap-5 lg:order-2">
          <div className="pr-panel p-6 lg:p-8">
            <p className="pr-eyebrow">{t.requiredQuiz}</p>
            <h1 className="pr-h2 mt-2">{quizTitle}</h1>

            <div className={`mt-6 flex items-center gap-5 rounded-[var(--radius-lg)] border p-5 ${
              didPass
                ? "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)]"
                : "border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)]"
            }`}>
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-[800] ${
                didPass ? "bg-[var(--success)] text-white" : "bg-[var(--warning)] text-white"
              }`}>
                {didPass ? "✓" : "↻"}
              </div>
              <div>
                <p className={`text-[11px] font-[800] uppercase tracking-[2px] ${didPass ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                  {didPass ? t.passedQuiz : t.quiz}
                </p>
                <p className="mt-1 text-[28px] font-[800] leading-none text-[var(--ink)]">
                  {previousScore}%
                  <span className="ms-2 text-[14px] font-[600] text-[var(--muted)]">
                    ({t.passingScore}: {passingScore}%)
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setRetaking(true)} className="pr-btn-primary">
                {t.tryAgain}
              </button>
              {previousLesson && (
                <Link href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(previousLesson.id)}`} className="pr-btn-ghost">
                  {t.previousLesson}
                </Link>
              )}
              {nextLesson ? (
                <Link href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(nextLesson.id)}`} className="pr-btn-secondary">
                  {t.nextLesson}
                </Link>
              ) : (
                <Link href={`/courses/${encodeURIComponent(course.id)}`} className="pr-btn-secondary">
                  {t.completeCourse}
                </Link>
              )}
            </div>
          </div>

          {reviewQuestions.map((q, idx) => (
            <article key={q.id} className="rounded-[var(--radius-lg)] border border-[rgba(24,130,92,0.2)] bg-[var(--card)] p-5 shadow-sm">
              <p className="text-xs font-[800] uppercase tracking-[1.5px] text-[var(--brand)]">
                {t.quiz} {idx + 1}
              </p>
              <h3 className="mt-2 text-xl font-[800] tracking-[-0.35px] text-[var(--ink)]">{q.prompt}</h3>

              {q.type === "TEXT_INPUT" ? (
                <div className="mt-4 rounded-[var(--radius)] border border-[rgba(24,130,92,0.3)] bg-[var(--success-50)] px-4 py-3">
                  <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--success)]">{t.correctAnswer}</p>
                  <p className="mt-1 text-sm font-[800] text-[var(--ink)]">{q.correctAnswer}</p>
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  {q.choices.map((choice) => (
                    <div
                      key={choice.id}
                      className={`min-h-11 rounded-[var(--radius)] border px-4 py-2.5 text-sm font-[800] ${
                        choice.isCorrect
                          ? "border-[var(--success)] bg-[var(--success)] text-white"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)]"
                      }`}
                    >
                      {choice.isCorrect ? "✓ " : ""}{choice.text}
                    </div>
                  ))}
                </div>
              )}

              {q.explanation ? (
                <div className="mt-4 rounded-[var(--radius)] border border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] p-3">
                  <p className="text-xs font-[800] uppercase tracking-[1.5px] text-[var(--brand)]">{t.explanationLabel}</p>
                  <p className="mt-1 text-sm font-[600] text-[var(--ink-2)]">{q.explanation}</p>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </main>
    );
  }

  /* ── Sequential lock: every CONTENT lesson preceding this quiz (across modules) must be done ── */
  const orderedLessons = course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
  const quizIndex = orderedLessons.findIndex((l) => l.id === quizLesson.id);
  const precedingLessons = quizIndex > 0
    ? orderedLessons.slice(0, quizIndex).filter((l) => l.type !== "QUIZ")
    : [];
  const incompleteLessons = precedingLessons.filter((l) => lessonStatuses[l.id] !== "COMPLETED");
  const lessonsLocked = !isComplete && !passed && incompleteLessons.length > 0;

  if (lessonsLocked) {
    return (
      <main className="pr-page grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <CourseSidebar {...sidebarProps} />

        <section className="order-1 grid min-w-0 auto-rows-min gap-5 lg:order-2">
          <div className="pr-panel p-6 lg:p-8">
            <p className="pr-eyebrow text-[var(--warning)]">{t.requiredQuiz}</p>
            <h1 className="pr-h2 mt-2">{t.completeLessonsFirst}</h1>
            <p className="pr-copy mt-3 max-w-2xl">{t.completeLessonsFirstHint}</p>

            <div className="mt-6 grid gap-2">
              {incompleteLessons.map((l) => {
                const isQuiz = l.type === "QUIZ";
                const href = isQuiz
                  ? `/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(l.moduleId)}`
                  : `/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(l.id)}`;
                return (
                  <Link
                    key={l.id}
                    href={href}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] font-[800] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.3)] hover:bg-[var(--card)]"
                  >
                    <LessonStateIcon state={lessonStatuses[l.id] === "IN_PROGRESS" ? "in_progress" : "not_started"} kind={lessonKindOf(l)} />
                    <span className="truncate">{usesPashtoContent(locale) ? l.titlePs : l.titleEn}</span>
                    <span className="ms-auto text-[12px] font-[800] text-[var(--brand)]">
                      {isQuiz ? t.testYourSkills : t.continueLesson}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ── Active quiz state ────────────────────────────────────── */
  function formatRetryTime(iso: string): string {
    const msLeft = new Date(iso).getTime() - Date.now();
    if (msLeft <= 0) return "now";
    const h = Math.floor(msLeft / 3_600_000);
    const m = Math.ceil((msLeft % 3_600_000) / 60_000);
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m} minute${m === 1 ? "" : "s"}`;
  }

  function attemptBanner() {
    if (!attemptStatus) return null;
    const attemptsUsed = liveAttemptsUsed;
    const retryAt = liveRetryAt;
    if (retryAt) {
      return (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(196,43,43,0.25)] bg-[var(--danger-50)] px-5 py-4">
          <p className="text-sm font-bold text-[var(--danger)]">
            {t.quizAllAttemptsUsed.replace("{time}", formatRetryTime(retryAt))}
          </p>
        </div>
      );
    }
    if (attemptsUsed === 0) {
      return (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <p className="text-sm font-bold text-[var(--ink-2)]">
            {t.quizAttemptInfo}
          </p>
        </div>
      );
    }
    if (attemptsUsed === 1) {
      return (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.25)] bg-[var(--warning-50)] px-5 py-4">
          <p className="text-sm font-bold text-[var(--warning)]">
            {t.quizAttempt2of3}
          </p>
        </div>
      );
    }
    if (attemptsUsed === 2) {
      return (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(196,43,43,0.25)] bg-[var(--danger-50)] px-5 py-4">
          <p className="text-sm font-bold text-[var(--danger)]">
            {t.quizAttempt3of3}
          </p>
        </div>
      );
    }
    return null;
  }

  const questions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: { en: q.promptEn, ps: q.promptPs },
    explanation: q.explanationEn || q.explanationPs || q.explanationDa
      ? { en: q.explanationEn ?? "", ps: q.explanationPs ?? "", fa: q.explanationDa ?? "" }
      : undefined,
    options: q.choices.map((c) => ({ en: c.textEn, ps: c.textPs, fa: c.textDa ?? c.textEn })),
    choiceIds: q.choices.map((c) => c.id),
    correctChoiceIds: q.choices.filter((c) => c.isCorrect).map((c) => c.id),
    correctAnswer: q.correctAnswer ?? undefined,
  }));

  return (
    <main className="pr-page grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <CourseSidebar {...sidebarProps} />

      <section className="order-1 grid min-w-0 auto-rows-min gap-5 lg:order-2">
        {attemptBanner()}
        <QuizBlock
          title={quizTitle}
          description={quizDesc}
          questions={questions}
          passScore={passingScore}
          onStart={async () => {
            const result = await startQuizAttempt({
              courseId: course.id,
              moduleId: module.id,
              lessonId: quizLesson.id,
            });
            if (!result.ok) throw new Error(result.error);
            return result.data.attemptId;
          }}
          onPass={async (selectedAnswers, attemptId) => {
            // Server is the source of truth — it scores and records completion.
            const result = await submitQuizAttempt({
              courseId: course.id,
              moduleId: module.id,
              lessonId: quizLesson.id,
              attemptId,
              selectedAnswers,
            });
            if (!result.ok) {
              throw new Error(result.error);
            }

            if (result.data.passed) {
              window.localStorage.setItem(quizProgressKey(course.id, module.id), "true");
              setPassedQuizzes((prev) => new Set([...prev, module.id]));
              setJustPassed(true);
              router.refresh();
            } else {
              const freshStatus = await getQuizAttemptStatus(quizLesson.id);
              setLiveAttemptsUsed(freshStatus.attemptsUsed);
              setLiveRetryAt(freshStatus.retryAt);
            }
            return result.data;
          }}
        />

        <div className="pr-card flex flex-wrap justify-between gap-3 p-4">
          {previousLesson ? (
            <Link href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(previousLesson.id)}`} className="pr-btn-ghost">
              {t.previousLesson}
            </Link>
          ) : <span />}
          {passed ? (
            nextLesson ? (
              <Link href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(nextLesson.id)}`} className="pr-btn-primary">
                {t.nextLesson}
              </Link>
            ) : (
              // Final quiz passed — go to the course homepage (rating + certificate preview)
              <Link href={`/courses/${encodeURIComponent(course.id)}`} className="pr-btn-primary">
                {t.completeCourse}
              </Link>
            )
          ) : (
            <span className="rounded-[var(--radius)] bg-[var(--warning-50)] px-4 py-2 text-sm font-[800] text-[var(--warning)]">
              {t.passingScore}: {passingScore}%
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
