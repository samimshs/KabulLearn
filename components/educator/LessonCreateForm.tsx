"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonType } from "@prisma/client";
import { createLesson } from "@/lib/actions/course-actions";

const lessonTypes: { value: LessonType; label: string }[] = [
  { value: LessonType.VIDEO, label: "Video" },
  { value: LessonType.READING, label: "Reading" },
  { value: LessonType.QUIZ, label: "Quiz" }
];

export function LessonCreateForm({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const router = useRouter();
  const [type, setType] = useState<LessonType>(LessonType.VIDEO);
  const [titleEn, setTitleEn] = useState("");
  const [titlePs, setTitlePs] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionPs, setDescriptionPs] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [readingEn, setReadingEn] = useState("");
  const [readingPs, setReadingPs] = useState("");
  const [isFinalTest, setIsFinalTest] = useState(false);
  const [passingScore, setPassingScore] = useState(70);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
            descriptionEn,
            descriptionPs,
            youtubeUrl: type === LessonType.VIDEO ? youtubeUrl : undefined,
            readingEn: type === LessonType.READING ? readingEn : undefined,
            readingPs: type === LessonType.READING ? readingPs : undefined,
            isFinalTest: type === LessonType.QUIZ ? isFinalTest : false,
            passingScore: type === LessonType.QUIZ ? passingScore : undefined
          });

          if (!result.ok) {
            setMessage(result.error);
            return;
          }

          setTitleEn("");
          setTitlePs("");
          setDescriptionEn("");
          setDescriptionPs("");
          setYoutubeUrl("");
          setReadingEn("");
          setReadingPs("");
          setIsFinalTest(false);
          setPassingScore(70);
          if (type === LessonType.QUIZ) {
            setMessage("Quiz created. Opening the question builder...");
            router.push(`/educator/courses/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(result.data.lessonId)}`);
            return;
          }

          setMessage("Lesson created. Add another lesson whenever this module needs one.");
          router.refresh();
        });
      }}
      className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4"
    >
      <div className="grid gap-2">
        <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">New lesson</p>
        <p className="text-sm text-[#525f6e]">Add videos or readings here. For quizzes, create the quiz shell and then add its questions.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Lesson type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as LessonType)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          >
            {lessonTypes.map((lessonType) => (
              <option key={lessonType.value} value={lessonType.value}>
                {lessonType.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          English title
          <input
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            placeholder="Lesson title"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Pashto title
          <input
            value={titlePs}
            onChange={(event) => setTitlePs(event.target.value)}
            placeholder="د درس سرلیک"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          English description
          <input
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
            placeholder="Optional English description"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
        Pashto description
        <input
          value={descriptionPs}
          onChange={(event) => setDescriptionPs(event.target.value)}
          placeholder="Optional Pashto description"
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
        />
      </label>

      {type === LessonType.VIDEO ? (
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          YouTube URL
          <input
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      ) : null}

      {type === LessonType.READING ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
            English content
            <textarea
              value={readingEn}
              onChange={(event) => setReadingEn(event.target.value)}
              rows={3}
              placeholder="Reading content"
              className="min-h-[90px] rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
            Pashto content
            <textarea
              value={readingPs}
              onChange={(event) => setReadingPs(event.target.value)}
              rows={3}
              placeholder="لیکنه"
              className="min-h-[90px] rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
            />
          </label>
        </div>
      ) : null}

      {type === LessonType.QUIZ ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
            Final test
            <input
              type="checkbox"
              checked={isFinalTest}
              onChange={(event) => setIsFinalTest(event.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-[#0f766e]"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
            Passing score
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(event) => setPassingScore(Number(event.target.value))}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
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
          {isPending ? "Adding..." : type === LessonType.QUIZ ? "Create quiz and add questions" : "Add lesson"}
        </button>
        {message ? <p className="text-sm text-[#0f766e]">{message}</p> : null}
      </div>
    </form>
  );
}
