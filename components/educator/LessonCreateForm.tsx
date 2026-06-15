"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonType } from "@prisma/client";
import { createLesson } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function LessonCreateForm({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [type, setType] = useState<LessonType>(LessonType.VIDEO);
  const [titleEn, setTitleEn] = useState("");
  const [titlePs, setTitlePs] = useState("");
  const [titleDa, setTitleDa] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionPs, setDescriptionPs] = useState("");
  const [descriptionDa, setDescriptionDa] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [readingEn, setReadingEn] = useState("");
  const [readingPs, setReadingPs] = useState("");
  const [readingDa, setReadingDa] = useState("");
  const [isFinalTest, setIsFinalTest] = useState(false);
  const [passingScore, setPassingScore] = useState(70);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lessonTypes = [
    { value: LessonType.VIDEO, label: t.video },
    { value: LessonType.READING, label: t.reading },
    { value: LessonType.QUIZ, label: t.quiz }
  ];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await createLesson({
            moduleId,
            type,
            titleEn,
            titlePs,
            titleDa,
            descriptionEn,
            descriptionPs,
            descriptionDa,
            youtubeUrl: type === LessonType.VIDEO ? youtubeUrl : undefined,
            readingEn: type === LessonType.READING ? readingEn : undefined,
            readingPs: type === LessonType.READING ? readingPs : undefined,
            readingDa: type === LessonType.READING ? readingDa : undefined,
            isFinalTest: type === LessonType.QUIZ ? isFinalTest : false,
            passingScore: type === LessonType.QUIZ ? passingScore : undefined
          });

          if (!result.ok) {
            setMessage(result.error);
            return;
          }

          setTitleEn("");
          setTitlePs("");
          setTitleDa("");
          setDescriptionEn("");
          setDescriptionPs("");
          setDescriptionDa("");
          setYoutubeUrl("");
          setReadingEn("");
          setReadingPs("");
          setReadingDa("");
          setIsFinalTest(false);
          setPassingScore(70);
          if (type === LessonType.QUIZ) {
            setMessage(t.quizCreatedMsg);
            router.push(`/educator/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(result.data.lessonId)}`);
            return;
          }

          setMessage(t.lessonCreatedMsg);
          router.refresh();
        });
      }}
      className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <div className="grid gap-2">
        <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.newLessonEyebrow}</p>
        <p className="text-sm text-[#525f6e]">{t.newLessonHint}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.lessonTypeLabel}
          <select
            value={type}
            onChange={(event) => setType(event.target.value as LessonType)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          >
            {lessonTypes.map((lessonType) => (
              <option key={lessonType.value} value={lessonType.value}>
                {lessonType.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishTitle}
          <input
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            placeholder="Lesson title"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoTitle}
          <input
            value={titlePs}
            dir="rtl"
            onChange={(event) => setTitlePs(event.target.value)}
            placeholder="د درس سرلیک"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariTitle}
          <input
            value={titleDa}
            dir="rtl"
            onChange={(event) => setTitleDa(event.target.value)}
            placeholder="عنوان درس"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishDescLabel}
          <input
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
            placeholder="Optional English description"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoDescLabel}
          <input
            value={descriptionPs}
            dir="rtl"
            onChange={(event) => setDescriptionPs(event.target.value)}
            placeholder="اختیاري پښتو تشریح"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariDescLabel}
          <input
            value={descriptionDa}
            dir="rtl"
            onChange={(event) => setDescriptionDa(event.target.value)}
            placeholder="توضیح اختیاری دری"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      {type === LessonType.VIDEO ? (
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.youtubeUrlLabel}
          <input
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      ) : null}

      {type === LessonType.READING ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
            {t.englishContentLabel}
            <textarea
              value={readingEn}
              onChange={(event) => setReadingEn(event.target.value)}
              rows={3}
              placeholder="Reading content"
              className="min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
            {t.pashtoContentLabel}
            <textarea
              value={readingPs}
              dir="rtl"
              onChange={(event) => setReadingPs(event.target.value)}
              rows={3}
              placeholder="لیکنه"
              className="min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
            {t.dariContentLabel}
            <textarea
              value={readingDa}
              dir="rtl"
              onChange={(event) => setReadingDa(event.target.value)}
              rows={3}
              placeholder="محتوای خواندنی"
              className="min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
            />
          </label>
        </div>
      ) : null}

      {type === LessonType.QUIZ ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
            {t.finalTestLabel}
            <input
              type="checkbox"
              checked={isFinalTest}
              onChange={(event) => setIsFinalTest(event.target.checked)}
              className="h-5 w-5 rounded border-[var(--border)] text-[#0f766e]"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
            {t.passingScore}
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(event) => setPassingScore(Number(event.target.value))}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-wait disabled:opacity-70"
        >
          {isPending ? t.addingLabel : type === LessonType.QUIZ ? t.createQuizBtn : t.addLessonBtn}
        </button>
        {message ? <p className="text-sm text-[#0f766e]">{message}</p> : null}
      </div>
    </form>
  );
}
