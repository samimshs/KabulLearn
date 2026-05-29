"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import curriculum from "@/data/data.json";
import { QuizBlock } from "@/components/QuizBlock";
import { useLanguage } from "@/components/LanguageProvider";
import { getPassedQuizzes, isModuleUnlocked, quizProgressKey } from "@/lib/progress";

type QuizViewProps = {
  courseId: string;
  moduleId: string;
};

export function QuizView({ courseId, moduleId }: QuizViewProps) {
  const { locale, t } = useLanguage();
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());
  const course = curriculum.courses.find((item) => item.id === courseId);
  const moduleIds = course?.modules.map((module) => module.id) ?? [];
  const moduleIndex = course?.modules.findIndex((module) => module.id === moduleId) ?? -1;
  const module = moduleIndex >= 0 ? course?.modules[moduleIndex] : null;
  const nextModule = course && moduleIndex >= 0 ? course.modules[moduleIndex + 1] : null;
  const previousLesson = module?.lessons[module.lessons.length - 1];
  const nextLesson = nextModule?.lessons[0];
  const unlocked = moduleIndex >= 0 ? isModuleUnlocked(moduleIndex, moduleIds, passedQuizzes) : false;
  const passed = passedQuizzes.has(moduleId);

  useEffect(() => {
    setPassedQuizzes(getPassedQuizzes(courseId, moduleIds));
  }, [courseId, moduleIds.join("|")]);

  if (!course || !module) {
    return (
      <main className="mx-auto grid min-h-[70vh] w-full max-w-7xl place-items-center px-5">
        <div className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black text-[#102033]">{t.notFound}</h1>
          <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-[#f0f4ff] hover:bg-[#1d4ed8]">
            {t.backToCourses}
          </Link>
        </div>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="mx-auto grid min-h-[70vh] w-full max-w-7xl place-items-center px-5">
        <div className="max-w-lg rounded-3xl border border-stone-200 bg-[#fffdfa] p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-wider text-red-700">{t.locked}</p>
          <h1 className="mt-3 text-3xl font-black text-[#102033]">{module.quiz.title[locale]}</h1>
          <p className="mt-4 leading-7 text-[#3d4a5a]">{t.lockedUntilQuiz}</p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white hover:bg-[#1d4ed8]">
            {t.backToCourses}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[336px_minmax(0,1fr)] lg:px-8 lg:py-8">
      <aside className="order-2 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-stone-200 bg-[#fffdfa] p-4 shadow-[0_14px_34px_rgba(16,32,51,0.07)] lg:sticky lg:top-24 lg:order-1">
        <div className="mb-4 border-b border-stone-200 pb-4">
          <Link href="/" className="text-sm font-black text-[#0f766e]">{t.backToCourses}</Link>
          <h2 className="mt-3 text-xl font-black tracking-tight text-[#102033]">{course.title[locale]}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#3d4a5a]">{t.courseNavigation}</p>
        </div>

        <nav className="grid gap-5">
          {course.modules.map((courseModule, courseModuleIndex) => {
            const courseModuleUnlocked = isModuleUnlocked(courseModuleIndex, moduleIds, passedQuizzes);
            return (
              <section key={courseModule.id} className="grid gap-2">
                <h3 className="px-2 text-xs font-black uppercase tracking-wider text-[#2d3e50]">
                  {courseModule.title[locale]}
                  {!courseModuleUnlocked ? ` · ${t.locked}` : ""}
                </h3>
                <div className="grid gap-1">
                  {courseModule.lessons.map((lesson) =>
                    courseModuleUnlocked ? (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="rounded-xl px-3 py-3 text-sm font-bold leading-5 text-[#1a2e42] transition hover:bg-stone-100"
                      >
                        {lesson.title[locale]}
                      </Link>
                    ) : (
                      <span key={lesson.id} className="rounded-xl px-3 py-3 text-sm font-bold leading-5 text-slate-500 opacity-70">
                        {lesson.title[locale]}
                      </span>
                    )
                  )}
                  {courseModuleUnlocked ? (
                    <Link
                      href={`/courses/${course.id}/quizzes/${courseModule.id}`}
                      className={`rounded-xl px-3 py-3 text-sm font-bold leading-5 transition ${
                        courseModule.id === module.id
                          ? "bg-[#0f3d5e] text-white shadow-sm"
                          : passedQuizzes.has(courseModule.id)
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-[#fff3c4] text-[#6b3d00] hover:bg-[#ffec99]"
                      }`}
                    >
                      {t.requiredQuiz}: {courseModule.quiz.title[locale]}
                    </Link>
                  ) : (
                    <span className="rounded-xl px-3 py-3 text-sm font-bold leading-5 text-slate-500 opacity-70">
                      {t.requiredQuiz}: {courseModule.quiz.title[locale]}
                    </span>
                  )}
                </div>
              </section>
            );
          })}
        </nav>
      </aside>

      <section className="order-1 grid min-w-0 gap-5 lg:order-2">
        <div className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-[0_14px_34px_rgba(16,32,51,0.07)] lg:p-7">
          <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.requiredQuiz}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#102033] lg:text-5xl">{module.quiz.title[locale]}</h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#3d4a5a]">{module.quiz.description[locale]}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {previousLesson ? (
              <Link
                href={`/courses/${course.id}/lessons/${previousLesson.id}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-black text-[#1a2e42] transition hover:border-stone-400 hover:bg-stone-50\"
              >
                {t.previousLesson}
              </Link>
            ) : null}
            {passed && nextLesson ? (
              <Link
                href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white transition hover:bg-[#1d4ed8]"
              >
                {t.nextLesson}
              </Link>
            ) : null}
          </div>
        </div>

        <QuizBlock
          questions={module.quiz.questions}
          passScore={module.quiz.passScore}
          onPass={() => {
            window.localStorage.setItem(quizProgressKey(course.id, module.id), "true");
            setPassedQuizzes(getPassedQuizzes(course.id, moduleIds));
          }}
        />

        <div className="flex flex-wrap justify-between gap-3 rounded-2xl border border-stone-200 bg-[#fffdfa] p-4 shadow-sm">
          {previousLesson ? (
            <Link href={`/courses/${course.id}/lessons/${previousLesson.id}`} className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-[#31465c]">
              {t.previousLesson}
            </Link>
          ) : null}
          {passed ? (
            nextLesson ? (
              <Link href={`/courses/${course.id}/lessons/${nextLesson.id}`} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0f3d5e] px-4 text-sm font-black text-white">
                {t.nextLesson}
              </Link>
            ) : (
              <Link href="/" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0f3d5e] px-4 text-sm font-black text-white">
                {t.completeCourse}
              </Link>
            )
          ) : (
            <span className="rounded-xl bg-[#fff3c4] px-4 py-2 text-sm font-black text-[#6b3d00]">
              {t.passingScore}: {module.quiz.passScore}%
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
