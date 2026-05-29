"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import curriculum from "@/data/data.json";
import { useLanguage } from "@/components/LanguageProvider";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getPassedQuizzes, isModuleUnlocked } from "@/lib/progress";

type LessonViewProps = {
  courseId: string;
  lessonId: string;
};

export function LessonView({ courseId, lessonId }: LessonViewProps) {
  const { locale, t } = useLanguage();
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());
  const course = curriculum.courses.find((item) => item.id === courseId);
  const moduleIds = course?.modules.map((module) => module.id) ?? [];
  const lessonSequence =
    course?.modules.flatMap((module) =>
      module.lessons.map((lessonItem) => ({
        ...lessonItem,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    ) ?? [];
  const lessonIndex = lessonSequence.findIndex((item) => item.id === lessonId);
  const lesson = lessonSequence[lessonIndex];
  const previousLesson = lessonIndex > 0 ? lessonSequence[lessonIndex - 1] : null;
  const moduleIndex = course?.modules.findIndex((module) => module.id === lesson?.moduleId) ?? -1;
  const currentModule = moduleIndex >= 0 ? course?.modules[moduleIndex] : null;
  const lessonIndexInModule = currentModule?.lessons.findIndex((item) => item.id === lessonId) ?? -1;
  const nextLessonInModule =
    currentModule && lessonIndexInModule >= 0 && lessonIndexInModule < currentModule.lessons.length - 1
      ? currentModule.lessons[lessonIndexInModule + 1]
      : null;
  const quizHref = currentModule ? `/courses/${courseId}/quizzes/${currentModule.id}` : "/";
  const moduleUnlocked = moduleIndex >= 0 ? isModuleUnlocked(moduleIndex, moduleIds, passedQuizzes) : false;

  useEffect(() => {
    setPassedQuizzes(getPassedQuizzes(courseId, moduleIds));
  }, [courseId, moduleIds.join("|")]);

  if (!course || !lesson) {
    return (
      <main className="mx-auto grid min-h-[70vh] w-full max-w-7xl place-items-center px-5">
        <div className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black text-[#102033]">{t.notFound}</h1>
          <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0f3d5e] px-5 text-sm font-black text-white">
            {t.backToCourses}
          </Link>
        </div>
      </main>
    );
  }

  if (!moduleUnlocked) {
    return (
      <main className="mx-auto grid min-h-[70vh] w-full max-w-7xl place-items-center px-5">
        <div className="max-w-lg rounded-3xl border border-stone-200 bg-[#fffdfa] p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-wider text-red-700">{t.locked}</p>
          <h1 className="mt-3 text-3xl font-black text-[#102033]">{lesson.title[locale]}</h1>
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
          {course.modules.map((module) => (
            <section key={module.id} className="grid gap-2">
              <h3 className="px-2 text-xs font-black uppercase tracking-wider text-[#2d3e50]">
                {module.title[locale]}
                {!isModuleUnlocked(course.modules.findIndex((item) => item.id === module.id), moduleIds, passedQuizzes) ? ` · ${t.locked}` : ""}
              </h3>
              <div className="grid gap-1">
                {module.lessons.map((moduleLesson) => {
                  const active = moduleLesson.id === lesson.id;
                  const locked = !isModuleUnlocked(course.modules.findIndex((item) => item.id === module.id), moduleIds, passedQuizzes);
                  if (locked) {
                    return (
                      <span key={moduleLesson.id} className="rounded-xl px-3 py-3 text-sm font-bold leading-5 text-slate-500 opacity-70">
                        {moduleLesson.title[locale]}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={moduleLesson.id}
                      href={`/courses/${course.id}/lessons/${moduleLesson.id}`}
                      className={`rounded-xl px-3 py-3 text-sm font-bold leading-5 transition ${
                        active ? "bg-[#2563eb] text-white shadow-sm" : "text-[#1a2e42] hover:bg-stone-100"
                      }`}
                    >
                      {moduleLesson.title[locale]}
                    </Link>
                  );
                })}
                {isModuleUnlocked(course.modules.findIndex((item) => item.id === module.id), moduleIds, passedQuizzes) ? (
                  <Link
                    href={`/courses/${course.id}/quizzes/${module.id}`}
                    className={`rounded-xl px-3 py-3 text-sm font-bold leading-5 transition ${
                      passedQuizzes.has(module.id)
                        ? "bg-emerald-100 text-emerald-900"
                        : module.id === currentModule?.id
                          ? "bg-[#fff3c4] text-[#5a2e00] hover:bg-[#ffec99]"
                          : "text-[#1a2e42] hover:bg-stone-100"
                    }`}
                  >
                    {t.requiredQuiz}: {module.quiz.title[locale]}
                  </Link>
                ) : (
                  <span className="rounded-xl px-3 py-3 text-sm font-bold leading-5 text-slate-500 opacity-70">
                    {t.requiredQuiz}: {module.quiz.title[locale]}
                  </span>
                )}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <section className="order-1 grid min-w-0 gap-5 lg:order-2">
        <div className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-[0_14px_34px_rgba(16,32,51,0.07)] lg:p-7">
          <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.currentLesson}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#102033] lg:text-5xl">{lesson.title[locale]}</h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#3d4a5a]">{lesson.description[locale]}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {previousLesson ? (
              <Link
                href={`/courses/${course.id}/lessons/${previousLesson.id}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-black text-[#1a2e42] transition hover:border-stone-400 hover:bg-stone-50"
              >
                {t.previousLesson}
              </Link>
            ) : null}
            {nextLessonInModule ? (
              <Link
                href={`/courses/${course.id}/lessons/${nextLessonInModule.id}`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white transition hover:bg-[#1d4ed8]"
              >
                {t.nextLesson}
              </Link>
            ) : (
              <Link
                href={quizHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white transition hover:bg-[#1d4ed8]"
              >
                {t.nextRequiredQuiz}
              </Link>
            )}
          </div>
        </div>

        <nav className="grid gap-2 rounded-2xl border border-stone-200 bg-[#fffdfa] p-3 shadow-sm sm:grid-cols-2">
          <a href="#video" className="inline-flex h-10 items-center justify-center rounded-xl bg-stone-100 px-4 text-sm font-black text-[#1a2e42] hover:bg-stone-200">
            {t.video}
          </a>
          <a href="#content" className="inline-flex h-10 items-center justify-center rounded-xl bg-stone-100 px-4 text-sm font-black text-[#1a2e42] hover:bg-stone-200">
            {t.lessonContent}
          </a>
        </nav>

        <section id="video" className="scroll-mt-24">
          <VideoPlayer video={lesson.youtubeId} />
          <div className="mt-4 flex justify-end">
            <a href="#content" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white">
              {t.nextSection}
            </a>
          </div>
        </section>

        <article id="content" className="scroll-mt-24 rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-[0_14px_34px_rgba(16,32,51,0.07)] lg:p-7">
          <h2 className="text-xl font-black text-[#102033]">{t.lessonDescription}</h2>
          <p className="mt-3 max-w-4xl font-medium leading-7 text-[#3d4a5a]">{lesson.description[locale]}</p>
          <h3 className="mt-6 text-lg font-black text-[#102033]">{t.lessonContent}</h3>
          <ol className="mt-4 grid gap-3">
            {lesson.content.map((item, index) => (
              <li key={item.en} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl bg-stone-50 p-4 font-medium text-[#1a2e42]">
                <span className="grid size-7 place-items-center rounded-full bg-[#0f766e] text-xs font-black text-white">{index + 1}</span>
                <span className="leading-7">{item[locale]}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold leading-6 text-teal-950">{t.lowBandwidth}</p>
          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <a href="#video" className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-[#1a2e42]">
              {t.previousSection}
            </a>
            <Link href={quizHref} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white">
              {t.nextRequiredQuiz}
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
