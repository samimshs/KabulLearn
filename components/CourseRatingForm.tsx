"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCourseRating } from "@/lib/actions/rating-actions";

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
  const [rating, setRating] = useState(initialRating ?? 5);
  const [comment, setComment] = useState(initialComment ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="pr-card grid gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await submitCourseRating({ courseId, rating, comment });
          setMessage(result.ok ? "Rating saved. Thank you." : result.error);
          if (result.ok) router.refresh();
        });
      }}
    >
      <div>
        <p className="pr-eyebrow">Course rating</p>
        <h2 className="pr-h2 mt-2 text-[26px]">How was this course?</h2>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Course rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`grid h-11 w-11 place-items-center rounded-full border text-lg font-[900] transition ${
              value <= rating
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--border)] bg-white text-[var(--muted)]"
            }`}
            aria-checked={rating === value}
            role="radio"
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional note"
        className="pr-input min-h-24"
      />
      <button type="submit" disabled={isPending} className="pr-btn-primary">
        {isPending ? "Saving..." : initialRating ? "Update rating" : "Submit rating"}
      </button>
      {message ? <p className="text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
    </form>
  );
}
