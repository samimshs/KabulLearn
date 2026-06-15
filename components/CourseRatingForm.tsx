"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCourseRating } from "@/lib/actions/rating-actions";
import { useLanguage } from "@/components/LanguageProvider";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 17.77 6.2 20.5l.99-5.79-4.21-4.1 5.82-.85L12 3.5z"
      />
    </svg>
  );
}

export function CourseRatingForm({
  courseId,
  initialRating,
  initialComment
}: {
  courseId: string;
  initialRating?: number | null;
  initialComment?: string | null;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [rating, setRating] = useState(initialRating ?? 5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] lg:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await submitCourseRating({ courseId, rating, comment });
          setMessage(result.ok ? "Rating saved — thank you!" : result.error);
          if (result.ok) router.refresh();
        });
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t.courseRating}</p>
      <h3 className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]">{t.howWasCourse}</h3>

      {/* Interactive star row */}
      <div className="mt-4 flex gap-1" role="radiogroup" aria-label={t.courseRating}>
        {[1, 2, 3, 4, 5].map((value) => {
          const active = value <= (hover || rating);
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              className={`rounded-md transition duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                active ? "text-amber-400" : "text-[var(--border)] hover:text-amber-300"
              }`}
            >
              <StarIcon filled={active} />
            </button>
          );
        })}
      </div>

      {/* Compact note */}
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder={t.ratingNotePlaceholder}
        className="mt-4 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-medium text-[var(--ink)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-100)]"
      />

      {/* Footer: message at start, action at logical end */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {message ? (
          <p className="text-sm font-semibold text-[var(--success)]">{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="ms-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--ink)] px-5 text-sm font-bold text-white transition hover:bg-[var(--ink-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? t.savingLabel : initialRating ? t.updateRating : t.submitRating}
        </button>
      </div>
    </form>
  );
}
