"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCourseForReview } from "@/lib/actions/course-actions";

export function CourseSubmitButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await submitCourseForReview({ courseId });

      if (!result.ok) {
        setIsError(true);
        setMessage(result.error);
        return;
      }

      setIsError(false);
      setMessage("Submitted for review.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="pr-btn-primary !min-h-10 px-4"
      >
        {isPending ? "Submitting..." : "Submit for review"}
      </button>
      {message ? (
        <p
          className={
            isError
              ? "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-[800] text-red-700"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-[800] text-emerald-700"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
