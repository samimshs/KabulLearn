"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuizBlock } from "@/components/QuizBlock";
import { useLanguage } from "@/components/LanguageProvider";
import { getPassedQuizzes, quizProgressKey } from "@/lib/progress";
import { startQuizAttempt, submitQuizAttempt } from "@/lib/actions/quiz-actions";
import { usesPashtoContent, type Locale, type Dictionary } from "@/lib/i18n";
import { type Course, type Module, type Lesson, type Question, type AnswerChoice } from "@prisma/client";

type QuizChoice = Pick<AnswerChoice, "id" | "textEn" | "textPs" | "isCorrect" | "order">;

type QuizQuestion = Pick<Question, "id" | "promptEn" | "promptPs" | "correctAnswer" | "explanationEn" | "explanationPs" | "order" | "type"> & {
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
  isComplete?: boolean;
  previousScore?: number | null;
};

/* ── Icons ─────────────────────────────────────────────────── */
const IconVideo = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M11 6.5l4-2v7l-4-2V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const IconQuiz = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 8h6M5 5.5h4M5 10.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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

/* ── Shared sidebar ─────────────────────────────────────────── */
function CourseSidebar({
  course,
  module,
  passedQuizzes,
  locale,
  t,
  direction,
}: {
  course: CourseWithModules;
  module: CourseModule;
  passedQuizzes: Set<string>;
  locale: Locale;
  t: Dictionary;
  direction: "ltr" | "rtl";
}) {
  const courseTitle = usesPashtoContent(locale) ? course.titlePs : course.titleEn;

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
            {t.backToCourses}
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
                      const isQuizType = lesson.type === "QUIZ";
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}`}
                          className="flex items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[700] text-[var(--ink-2)] transition hover:bg-[var(--surface)]"
                        >
                          <span className="text-[var(--muted)]">{isQuizType ? <IconQuiz /> : <IconVideo />}</span>
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}

                    {/* Required quiz link */}
                    <Link
                      href={`/courses/${encodeURIComponent(course.id)}/quizzes/${encodeURIComponent(mod.id)}`}
                      className={`flex items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-[13px] font-[800] transition ${
                        isCurrentModule
                          ? "bg-[var(--brand)] text-white shadow-sm"
                          : quizPassed
                            ? "bg-[var(--success-50)] text-[var(--success)]"
                            : "text-[var(--ink-2)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <span className={isCurrentModule ? "text-white/80" : quizPassed ? "" : "text-[var(--muted)]"}>
                        {quizPassed ? <IconCheck /> : <IconQuiz />}
                      </span>
                      <span className="truncate">{t.requiredQuiz}</span>
                      {quizPassed && (
                        <span className="ms-auto text-[10px] font-[800] uppercase tracking-wider opacity-70">
                          {t.completed}
                        </span>
                      )}
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
  isComplete = false,
  previousScore = null,
}: QuizViewProps) {
  const { locale, t, direction } = useLanguage();
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set(serverPassedModuleIds));
  const [retaking, setRetaking] = useState(false);

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

  const sidebarProps = { course, module, passedQuizzes, locale, t, direction };

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

  /* ── Previously-passed state ──────────────────────────────── */
  if (previousScore !== null && !retaking) {
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
                <Link href={`/courses/${encodeURIComponent(course.id)}/certificate`} className="pr-btn-secondary">
                  {t.downloadCertificate}
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ── Active quiz state ────────────────────────────────────── */
  const questions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: { en: q.promptEn, ps: q.promptPs },
    explanation: q.explanationEn || q.explanationPs
      ? { en: q.explanationEn ?? "", ps: q.explanationPs ?? "" }
      : undefined,
    options: q.choices.map((c) => ({ en: c.textEn, ps: c.textPs })),
    choiceIds: q.choices.map((c) => c.id),
    correctChoiceIds: q.choices.filter((c) => c.isCorrect).map((c) => c.id),
    correctAnswer: q.correctAnswer ?? undefined,
  }));

  return (
    <main className="pr-page grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <CourseSidebar {...sidebarProps} />

      <section className="order-1 grid min-w-0 auto-rows-min gap-5 lg:order-2">
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
            if (!result.ok) {
              console.warn("Could not start quiz attempt:", result.error);
              return null;
            }
            return result.data.attemptId;
          }}
          onPass={async (selectedAnswers, attemptId) => {
            // Save locally first — never block the student
            window.localStorage.setItem(quizProgressKey(course.id, module.id), "true");
            const localPassed = getPassedQuizzes(course.id, moduleIds);
            setPassedQuizzes(new Set([...localPassed, ...serverPassedModuleIds]));

            // Then attempt server sync (best-effort)
            const result = await submitQuizAttempt({
              courseId: course.id,
              moduleId: module.id,
              lessonId: quizLesson.id,
              attemptId,
              selectedAnswers,
            });
            if (!result.ok) {
              console.warn("Quiz server sync warning:", result.error);
            }
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
              <Link href={`/courses/${encodeURIComponent(course.id)}/certificate`} className="pr-btn-primary">
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
