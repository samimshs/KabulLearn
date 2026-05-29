"use client";

import Link from "next/link";
import curriculum from "@/data/data.json";
import { useLanguage } from "@/components/LanguageProvider";

export function CourseDashboard() {
  const { locale, t } = useLanguage();

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 lg:px-8 lg:py-10">
      <section className="grid gap-6 rounded-3xl border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_18px_50px_rgba(16,32,51,0.08)] lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:p-8">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.availableCourses}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#102033] lg:text-6xl">{t.dashboard}</h1>
        </div>
        <p className="max-w-2xl text-base font-medium leading-7 text-[#2d3e50] lg:justify-self-end">{t.dashboardIntro}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {curriculum.courses.map((course) => {
          const lessonCount = course.modules.reduce((count, module) => count + module.lessons.length, 0);
          const firstLesson = course.modules[0]?.lessons[0];

          return (
            <article key={course.id} className="grid min-h-80 content-between rounded-3xl border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_14px_34px_rgba(16,32,51,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(16,32,51,0.1)]">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                    {course.level[locale]}
                  </span>
                  <span className="text-sm font-bold text-[#2d3e50]">
                    {course.modules.length} {t.modules} · {lessonCount} {t.lessons}
                  </span>
                </div>
                <h2 className="mt-8 text-3xl font-black tracking-tight text-[#102033]">{course.title[locale]}</h2>
                <p className="mt-4 font-medium leading-7 text-[#3d4a5a]">{course.description[locale]}</p>
                <div className="mt-6 grid gap-2">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                      <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-black text-[#0f3d5e] shadow-sm">{index + 1}</span>
                      <span className="text-sm font-bold text-[#1a2e42]">
                        {module.title[locale]} · {module.lessons.length} {t.lessons} · {t.requiredQuiz}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {firstLesson ? (
                <Link
                  href={`/courses/${course.id}/lessons/${firstLesson.id}`}
                  className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white transition hover:bg-[#1d4ed8]"
                >
                  {t.startLearning}
                </Link>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
