"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonType } from "@prisma/client";
import { updateLesson } from "@/lib/actions/course-actions";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { useLanguage } from "@/components/LanguageProvider";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";

export function LessonUpdateForm({
  lesson
}: {
  lesson: {
    id: string;
    moduleId: string;
    type: LessonType;
    titleEn: string;
    titlePs: string;
    titleDa?: string | null;
    descriptionEn?: string | null;
    descriptionPs?: string | null;
    descriptionDa?: string | null;
    youtubeUrl?: string | null;
    readingEn?: string | null;
    readingPs?: string | null;
    readingDa?: string | null;
    isFinalTest: boolean;
    passingScore?: number | null;
  };
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    titleEn: lesson.titleEn,
    titlePs: lesson.titlePs,
    titleDa: lesson.titleDa ?? "",
    descriptionEn: lesson.descriptionEn ?? "",
    descriptionPs: lesson.descriptionPs ?? "",
    descriptionDa: lesson.descriptionDa ?? "",
    youtubeUrl: lesson.youtubeUrl ?? "",
    readingEn: lesson.readingEn ?? "",
    readingPs: lesson.readingPs ?? "",
    readingDa: lesson.readingDa ?? "",
    isFinalTest: lesson.isFinalTest,
    passingScore: lesson.passingScore ?? 70
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateLesson({
            lessonId: lesson.id,
            moduleId: lesson.moduleId,
            type: lesson.type,
            ...form
          });
          setMessage(result.ok ? t.lessonUpdated : result.error);
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishTitle}
          <input className={inputCls} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Lesson title" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoTitle}
          <input className={inputCls} dir="rtl" value={form.titlePs} onChange={(e) => setForm({ ...form, titlePs: e.target.value })} placeholder="د درس سرلیک" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariTitle}
          <input className={inputCls} dir="rtl" value={form.titleDa} onChange={(e) => setForm({ ...form, titleDa: e.target.value })} placeholder="عنوان درس" />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishDescLabel}
          <input className={inputCls} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Short description" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoDescLabel}
          <input className={inputCls} dir="rtl" value={form.descriptionPs} onChange={(e) => setForm({ ...form, descriptionPs: e.target.value })} placeholder="لنډه تشریح" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariDescLabel}
          <input className={inputCls} dir="rtl" value={form.descriptionDa} onChange={(e) => setForm({ ...form, descriptionDa: e.target.value })} placeholder="توضیح کوتاه" />
        </label>
      </div>

      {lesson.type === LessonType.VIDEO ? (
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.youtubeUrlLabel}
          <input className={inputCls} value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
        </label>
      ) : null}

      {lesson.type === LessonType.READING ? (
        <div className="grid gap-3">
          <p className="text-xs font-[800] uppercase tracking-[1px] text-[#64748b]">
            Markdown supported: # heading, ## section, - bullets, 1. steps, **bold**
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
              {t.englishContentLabel}
              <textarea className={`min-h-40 ${inputCls}`} value={form.readingEn} onChange={(e) => setForm({ ...form, readingEn: e.target.value })} placeholder="Reading content" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
              {t.pashtoContentLabel}
              <textarea className={`min-h-40 ${inputCls}`} dir="rtl" value={form.readingPs} onChange={(e) => setForm({ ...form, readingPs: e.target.value })} placeholder="لیکنه" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
              {t.dariContentLabel}
              <textarea className={`min-h-40 ${inputCls}`} dir="rtl" value={form.readingDa} onChange={(e) => setForm({ ...form, readingDa: e.target.value })} placeholder="محتوای خواندنی" />
            </label>
          </div>
          {form.readingEn ? (
            <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <summary className="cursor-pointer text-xs font-[800] uppercase tracking-[1px] text-[#0f766e]">Preview English reading</summary>
              <div className="mt-3 rounded-xl bg-[var(--card)] p-4">
                <SimpleMarkdown content={form.readingEn} />
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      {lesson.type === LessonType.QUIZ ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-medium text-[var(--ink-2)]">
            <input
              type="checkbox"
              checked={form.isFinalTest}
              onChange={(e) => setForm({ ...form, isFinalTest: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border)] text-[#0f766e]"
            />
            {t.finalTestLabel}
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
            {t.passingScore}
            <input
              className={inputCls}
              type="number"
              min={0}
              max={100}
              value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
            />
          </label>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? t.saving : t.saveChanges}
      </button>
      {message ? <p className="text-sm font-[700] text-[#0f766e]">{message}</p> : null}
    </form>
  );
}
