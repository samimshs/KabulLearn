"use client";

import { useState } from "react";
import { AiCourseBuilderAgent } from "@/components/educator/AiCourseBuilderAgent";
import { CourseCreateForm } from "@/components/educator/CourseCreateForm";
import { useLanguage } from "@/components/LanguageProvider";

type Mode = "choice" | "manual" | "ai";

const CHOICE_COPY = {
  en: {
    back: "Back to creation options",
    eyebrow: "Course creation",
    title: "How would you like to start?",
    intro: "Build your course manually, or let the AI Course Builder create a complete draft that you can review, edit, and save.",
    manualTitle: "Create manually",
    manualDescription: "Use the guided course builder you already know, with full control over each field and lesson.",
    manualAction: "Start manual setup",
    aiTitle: "Generate with AI Agent",
    aiDescription: "Create a full draft course with modules, lessons, quizzes, slide outlines, narration scripts, and video metadata.",
    aiAction: "Open AI builder"
  },
  ps: {
    back: "د جوړولو انتخابونو ته ستنېدل",
    eyebrow: "د کورس جوړول",
    title: "څنګه پیل کول غواړئ؟",
    intro: "کورس پخپله په لارښود بڼه جوړ کړئ، یا د AI کورس جوړوونکي ته اجازه ورکړئ چې بشپړه مسوده جوړه کړي او تاسو یې بیا وکتئ، سم یې کړئ او خوندي یې کړئ.",
    manualTitle: "پخپله جوړول",
    manualDescription: "هماغه لارښود کورس جوړوونکی وکاروئ چې پېژنئ؛ هره برخه او هر لوست په بشپړ واک سره تنظیم کړئ.",
    manualAction: "لاسي جوړول پیل کړئ",
    aiTitle: "د AI Agent په مرسته جوړول",
    aiDescription: "د ماډیولونو، لوستونو، ازموینو، سلایډي طرحو، وینا متنونو او ویډیويي metadata سره بشپړه مسوده جوړه کړئ.",
    aiAction: "د AI جوړوونکی پرانیزئ"
  },
  fa: {
    back: "بازگشت به گزینه‌های ساخت کورس",
    eyebrow: "ساخت کورس",
    title: "چگونه می‌خواهید شروع کنید؟",
    intro: "کورس را به‌صورت دستی و راهنمایی‌شده بسازید، یا بگذارید سازنده کورس با AI یک مسوده کامل بسازد تا شما آن را بازبینی، ویرایش و ذخیره کنید.",
    manualTitle: "ساخت دستی",
    manualDescription: "از همان سازنده راهنمای کورس استفاده کنید؛ با کنترل کامل روی هر بخش و هر درس.",
    manualAction: "شروع ساخت دستی",
    aiTitle: "ساخت با AI Agent",
    aiDescription: "یک مسوده کامل با ماژول‌ها، درس‌ها، آزمون‌ها، طرح سلایدها، متن گفتار و metadata ویدیویی بسازید.",
    aiAction: "باز کردن سازنده AI"
  }
} as const;

export function CourseCreationChoice() {
  const [mode, setMode] = useState<Mode>("choice");
  const { locale } = useLanguage();
  const isRtl = locale === "ps" || locale === "fa";
  const copy = locale === "ps" ? CHOICE_COPY.ps : locale === "fa" ? CHOICE_COPY.fa : CHOICE_COPY.en;

  if (mode === "manual") {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">
        <button type="button" onClick={() => setMode("choice")} className="pr-btn-ghost !min-h-9 px-3 text-[12px]">
          {copy.back}
        </button>
        <CourseCreateForm />
      </div>
    );
  }

  if (mode === "ai") {
    return <AiCourseBuilderAgent onBack={() => setMode("choice")} />;
  }

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[color:var(--brand)]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[color:var(--ink)] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-base font-semibold leading-7 text-[color:var(--muted)]">
            {copy.intro}
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--brand)] hover:bg-[color:var(--card)] hover:shadow-[var(--shadow)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,87,255,0.16)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--card)] text-xl shadow-sm">✎</span>
            <span className="mt-5 block text-xl font-black text-[color:var(--ink)]">{copy.manualTitle}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-[color:var(--muted)]">
              {copy.manualDescription}
            </span>
            <span className="mt-5 inline-flex text-sm font-black text-[color:var(--brand)]">{copy.manualAction}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("ai")}
            className="group rounded-2xl border border-[color:var(--brand)] bg-[color:var(--brand-50)] p-5 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[color:var(--card)] hover:shadow-[var(--shadow)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,87,255,0.16)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] text-xl text-white shadow-sm">AI</span>
            <span className="mt-5 block text-xl font-black text-[color:var(--ink)]">{copy.aiTitle}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-[color:var(--muted)]">
              {copy.aiDescription}
            </span>
            <span className="mt-5 inline-flex text-sm font-black text-[color:var(--brand)]">{copy.aiAction}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
