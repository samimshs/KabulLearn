"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCourseForReview } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function CourseSubmitButton({ courseId, courseStatus: _ }: { courseId: string; courseStatus: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await submitCourseForReview({ courseId });
      if (!result.ok) {
        setError(result.error ?? "Could not submit the course for review.");
        return;
      }
      router.push("/educator");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="pr-btn-primary !min-h-10 px-4"
      >
        {isPending ? t.submitting : t.submitForReview}
      </button>
      {error && (
        <p className="max-w-xs text-right text-[12px] font-[600] text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}
