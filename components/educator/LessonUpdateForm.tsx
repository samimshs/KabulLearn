"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonType } from "@prisma/client";
import { updateLesson } from "@/lib/actions/course-actions";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { useLanguage } from "@/components/LanguageProvider";

export function LessonUpdateForm({
  lesson
}: {
  lesson: {
    id: string;
    moduleId: string;
    type: LessonType;
    titleEn: string;
    titlePs: string;
    descriptionEn?: string | null;
    descriptionPs?: string | null;
    youtubeUrl?: string | null;
    readingEn?: string | null;
    readingPs?: string | null;
    isFinalTest: boolean;
    passingScore?: number | null;
  };
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    titleEn: lesson.titleEn,
    titlePs: lesson.titlePs,
    descriptionEn: lesson.descriptionEn ?? "",
    descriptionPs: lesson.descriptionPs ?? "",
    youtubeUrl: lesson.youtubeUrl ?? "",
    readingEn: lesson.readingEn ?? "",
    readingPs: lesson.readingPs ?? "",
    isFinalTest: lesson.isFinalTest,
    passingScore: lesson.passingScore ?? 70
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <details className="rounded-[var(--radius)] border border-[var(--border)] bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-[800] uppercase tracking-[1px] text-[var(--brand)]">
        {t.editLesson}
      </summary>
      <form
        className="grid gap-3 border-t border-[var(--border)] p-3"
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
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="pr-input" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder={t.englishTitle} />
          <input className="pr-input" value={form.titlePs} onChange={(e) => setForm({ ...form, titlePs: e.target.value })} placeholder={t.pashtoTitle} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="pr-input" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder={t.englishDescLabel} />
          <input className="pr-input" value={form.descriptionPs} onChange={(e) => setForm({ ...form, descriptionPs: e.target.value })} placeholder={t.pashtoDescLabel} />
        </div>
        {lesson.type === LessonType.VIDEO ? (
          <input className="pr-input" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder={t.youtubeUrlLabel} />
        ) : null}
        {lesson.type === LessonType.READING ? (
          <div className="grid gap-3">
            <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
              Markdown supported: # heading, ## section, - bullets, 1. steps, **bold**
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea className="pr-input min-h-40" value={form.readingEn} onChange={(e) => setForm({ ...form, readingEn: e.target.value })} placeholder={t.englishContentLabel} />
              <textarea className="pr-input min-h-40" value={form.readingPs} onChange={(e) => setForm({ ...form, readingPs: e.target.value })} placeholder={t.pashtoContentLabel} />
            </div>
            {form.readingEn ? (
              <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
                <summary className="cursor-pointer text-xs font-[800] uppercase tracking-[1px] text-[var(--brand)]">Preview English reading</summary>
                <div className="mt-3 rounded-[var(--radius)] bg-white p-4">
                  <SimpleMarkdown content={form.readingEn} />
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
        {lesson.type === LessonType.QUIZ ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-[800] text-[var(--ink-2)]">
              <input type="checkbox" checked={form.isFinalTest} onChange={(e) => setForm({ ...form, isFinalTest: e.target.checked })} />
              {t.finalTestLabel}
            </label>
            <input className="pr-input" type="number" min={0} max={100} value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })} />
          </div>
        ) : null}
        <button type="submit" disabled={isPending} className="pr-btn-secondary !min-h-10">
          {isPending ? t.saving : t.saveChanges}
        </button>
        {message ? <p className="text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
      </form>
    </details>
  );
}
