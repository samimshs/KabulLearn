"use client";

import { useState, useTransition } from "react";
import { deleteLesson } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            const result = await deleteLesson({ lessonId });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage(t.lessonRemoved);
          })
        }
        disabled={isPending}
        className="pr-btn-ghost !min-h-9 px-3 text-xs uppercase tracking-[1px] text-[var(--muted)]"
      >
        {isPending ? t.removingLabel : t.removeLabel}
      </button>
      {message ? <p className="text-xs font-[700] text-[var(--danger)]">{message}</p> : null}
    </div>
  );
}
