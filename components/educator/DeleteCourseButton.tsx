"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCourse } from "@/lib/actions/course-actions";

export function DeleteCourseButton({ courseId, label = "this course" }: { courseId: string; label?: string }) {
  const router = useRouter();
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
        Delete
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-lg)]">
            <p className="pr-eyebrow text-[var(--danger)]">Delete course</p>
            <h2 className="mt-3 text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">
              This cannot be undone.
            </h2>
            <p className="mt-3 text-sm font-[600] leading-6 text-[var(--muted)]">
              You are about to delete {label}. This removes modules, lessons, progress, submissions, ratings, certificates, and discussions tied to it.
            </p>
            {message ? (
              <p className="mt-3 rounded-[var(--radius)] bg-[var(--danger-50)] p-3 text-sm font-[800] text-[var(--danger)]">
                {message}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="pr-btn-ghost">
                Cancel
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
                {isPending ? "Deleting..." : "Delete course"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
