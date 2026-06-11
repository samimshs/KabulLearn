"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateModule } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function ModuleUpdateForm({
  courseId,
  moduleId,
  titleEn,
  titlePs,
  titleDa,
  descriptionEn,
  descriptionPs,
  descriptionDa
}: {
  courseId: string;
  moduleId: string;
  titleEn: string;
  titlePs: string;
  titleDa?: string | null;
  descriptionEn?: string | null;
  descriptionPs?: string | null;
  descriptionDa?: string | null;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    titleEn,
    titlePs,
    titleDa: titleDa ?? "",
    descriptionEn: descriptionEn ?? "",
    descriptionPs: descriptionPs ?? "",
    descriptionDa: descriptionDa ?? ""
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <summary className="cursor-pointer list-none px-4 py-2 text-xs font-[800] uppercase tracking-[1px] text-[var(--brand)]">
        {t.editModule}
      </summary>
      <form
        className="grid gap-3 border-t border-[var(--border)] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateModule({ courseId, moduleId, ...form });
            setMessage(result.ok ? t.moduleUpdated : result.error);
            if (result.ok) router.refresh();
          });
        }}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="pr-input" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder={t.englishTitle} />
          <input className="pr-input" dir="rtl" value={form.titlePs} onChange={(e) => setForm({ ...form, titlePs: e.target.value })} placeholder={t.pashtoTitle} />
          <input className="pr-input" dir="rtl" value={form.titleDa} onChange={(e) => setForm({ ...form, titleDa: e.target.value })} placeholder={t.dariTitle} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <textarea className="pr-input min-h-24" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder={t.englishSummary} />
          <textarea className="pr-input min-h-24" dir="rtl" value={form.descriptionPs} onChange={(e) => setForm({ ...form, descriptionPs: e.target.value })} placeholder={t.pashtoSummary} />
          <textarea className="pr-input min-h-24" dir="rtl" value={form.descriptionDa} onChange={(e) => setForm({ ...form, descriptionDa: e.target.value })} placeholder={t.dariSummary} />
        </div>
        <button type="submit" disabled={isPending} className="pr-btn-secondary !min-h-10">
          {isPending ? t.saving : t.saveChanges}
        </button>
        {message ? <p className="text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
      </form>
    </details>
  );
}
