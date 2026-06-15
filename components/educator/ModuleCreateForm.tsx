"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createModule } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function ModuleCreateForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [titleEn, setTitleEn] = useState("");
  const [titlePs, setTitlePs] = useState("");
  const [titleDa, setTitleDa] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionPs, setDescriptionPs] = useState("");
  const [descriptionDa, setDescriptionDa] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await createModule({
            courseId,
            titleEn,
            titlePs,
            titleDa,
            descriptionEn,
            descriptionPs,
            descriptionDa
          });

          if (!result.ok) {
            setMessage(result.error);
            return;
          }

          setTitleEn("");
          setTitlePs("");
          setTitleDa("");
          setDescriptionEn("");
          setDescriptionPs("");
          setDescriptionDa("");
          setMessage(t.moduleCreated);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.newModule}</p>
        <p className="text-sm text-[#525f6e]">{t.addAsManyModules}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishTitle}
          <input
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            placeholder="Module title"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoTitle}
          <input
            value={titlePs}
            dir="rtl"
            onChange={(event) => setTitlePs(event.target.value)}
            placeholder="د برخې سرلیک"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariTitle}
          <input
            value={titleDa}
            dir="rtl"
            onChange={(event) => setTitleDa(event.target.value)}
            placeholder="عنوان بخش"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.englishSummary}
          <textarea
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
            rows={3}
            placeholder="Short module description"
            className="min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.pashtoSummary}
          <textarea
            value={descriptionPs}
            dir="rtl"
            onChange={(event) => setDescriptionPs(event.target.value)}
            rows={3}
            placeholder="لنډه تشریح"
            className="min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[var(--ink-2)]">
          {t.dariSummary}
          <textarea
            value={descriptionDa}
            dir="rtl"
            onChange={(event) => setDescriptionDa(event.target.value)}
            rows={3}
            placeholder="توضیح کوتاه بخش"
            className="min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-wait disabled:opacity-70"
        >
          {isPending ? t.addingModule : t.addModule}
        </button>
        {message ? <p className="text-sm text-[#0f766e]">{message}</p> : null}
      </div>
    </form>
  );
}
