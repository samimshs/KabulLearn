"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCourseForReview } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function CourseSubmitButton({ courseId, courseStatus: _ }: { courseId: string; courseStatus: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await submitCourseForReview({ courseId });
      router.push("/educator");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="pr-btn-primary !min-h-10 px-4"
    >
      {isPending ? t.submitting : t.submitForReview}
    </button>
  );
}
