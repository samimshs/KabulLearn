"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateModule } from "@/lib/actions/course-actions";

export function ModuleUpdateForm({
  courseId,
  moduleId,
  titleEn,
  titlePs,
  descriptionEn,
  descriptionPs
}: {
  courseId: string;
  moduleId: string;
  titleEn: string;
  titlePs: string;
  descriptionEn?: string | null;
  descriptionPs?: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    titleEn,
    titlePs,
    descriptionEn: descriptionEn ?? "",
    descriptionPs: descriptionPs ?? ""
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <summary className="cursor-pointer list-none px-4 py-2 text-xs font-[800] uppercase tracking-[1px] text-[var(--brand)]">
        Edit module
      </summary>
      <form
        className="grid gap-3 border-t border-[var(--border)] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateModule({ courseId, moduleId, ...form });
            setMessage(result.ok ? "Module updated. Submit the course again when ready." : result.error);
            if (result.ok) router.refresh();
          });
        }}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="pr-input" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="English title" />
          <input className="pr-input" value={form.titlePs} onChange={(e) => setForm({ ...form, titlePs: e.target.value })} placeholder="Pashto title" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <textarea className="pr-input min-h-24" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="English summary" />
          <textarea className="pr-input min-h-24" value={form.descriptionPs} onChange={(e) => setForm({ ...form, descriptionPs: e.target.value })} placeholder="Pashto summary" />
        </div>
        <button type="submit" disabled={isPending} className="pr-btn-secondary !min-h-10">
          {isPending ? "Saving..." : "Save module"}
        </button>
        {message ? <p className="text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
      </form>
    </details>
  );
}
