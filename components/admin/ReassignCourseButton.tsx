"use client";

import { useRef, useState, useTransition } from "react";
import { reassignCourse } from "@/lib/actions/user-actions";

type Educator = { id: string; name: string | null; email: string };

export function ReassignCourseButton({
  courseId,
  courseTitle,
  currentAuthorId,
  educators
}: {
  courseId: string;
  courseTitle: string;
  currentAuthorId: string;
  educators: Educator[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    setSelectedId("");
    setError(null);
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    setOpen(false);
    dialogRef.current?.close();
  }

  function handleConfirm() {
    if (!selectedId) { setError("Please select an educator."); return; }
    setError(null);
    startTransition(async () => {
      const result = await reassignCourse({ courseId, newAuthorId: selectedId });
      if (!result.ok) { setError(result.error ?? "Could not reassign the course."); return; }
      closeModal();
    });
  }

  const eligible = educators.filter((e) => e.id !== currentAuthorId);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-[800] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--brand)]"
      >
        Reassign
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeModal}
        className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop:bg-black/40"
      >
        <h2 className="text-[17px] font-[900] text-[var(--ink)]">Reassign course</h2>
        <p className="mt-1 text-[13px] font-[600] text-[var(--muted)] line-clamp-2">
          <span className="font-[800] text-[var(--ink-2)]">{courseTitle}</span>
        </p>

        <div className="mt-5 grid gap-1.5">
          <label className="text-[12px] font-[800] uppercase tracking-[0.8px] text-[var(--muted)]">
            New educator
          </label>
          {eligible.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13px] font-[600] text-[var(--muted)]">
              No other educators found.
            </p>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setError(null); }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[14px] font-[700] text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            >
              <option value="">— select an educator —</option>
              {eligible.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name ? `${ed.name} (${ed.email})` : ed.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p className="mt-3 text-[12px] font-[700] text-[var(--error)]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeModal}
            disabled={isPending}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-[800] text-[var(--ink-2)] transition hover:bg-[var(--card)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || eligible.length === 0}
            className="rounded-xl bg-[var(--brand)] px-4 py-2 text-[13px] font-[800] text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Reassigning…" : "Confirm"}
          </button>
        </div>
      </dialog>
    </>
  );
}
