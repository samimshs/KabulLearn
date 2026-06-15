"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateModule } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

const inputCls = "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";

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
    <form
      className="grid gap-3"
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
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishTitle}
          <input className={inputCls} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Module title" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoTitle}
          <input className={inputCls} dir="rtl" value={form.titlePs} onChange={(e) => setForm({ ...form, titlePs: e.target.value })} placeholder="د برخې سرلیک" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariTitle}
          <input className={inputCls} dir="rtl" value={form.titleDa} onChange={(e) => setForm({ ...form, titleDa: e.target.value })} placeholder="عنوان بخش" />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishSummary}
          <textarea className={`min-h-24 ${inputCls}`} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Short module description" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoSummary}
          <textarea className={`min-h-24 ${inputCls}`} dir="rtl" value={form.descriptionPs} onChange={(e) => setForm({ ...form, descriptionPs: e.target.value })} placeholder="لنډه تشریح" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariSummary}
          <textarea className={`min-h-24 ${inputCls}`} dir="rtl" value={form.descriptionDa} onChange={(e) => setForm({ ...form, descriptionDa: e.target.value })} placeholder="توضیح کوتاه بخش" />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? t.saving : t.saveChanges}
      </button>
      {message ? <p className="text-sm font-[700] text-[#0f766e]">{message}</p> : null}
    </form>
  );
}
