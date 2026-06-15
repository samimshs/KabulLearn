"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCourse } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function DeleteCourseButton({ courseId, label = "" }: { courseId: string; label?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pr-btn-danger"
      >
        {t.deleteCourse}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)]">
            <p className="pr-eyebrow text-[var(--danger)]">{t.deleteCourse}</p>
            <h2 className="mt-3 text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">
              {t.deleteCourseCannotUndo}
            </h2>
            <p className="mt-3 text-sm font-[600] leading-6 text-[var(--muted)]">
              {t.deleteCourseDesc.replace("{title}", label)}
            </p>
            {message ? (
              <p className="mt-3 rounded-[var(--radius)] bg-[var(--danger-50)] p-3 text-sm font-[800] text-[var(--danger)]">
                {message}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="pr-btn-ghost">
                {t.cancelLabel}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    setMessage(null);
                    const result = await deleteCourse({ courseId });
                    if (!result.ok) {
                      setMessage(result.error);
                      return;
                    }
                    setOpen(false);
                    router.refresh();
                  })
                }
                className="pr-btn-danger"
              >
                {isPending ? t.deletingLabel : t.deleteCourse}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
