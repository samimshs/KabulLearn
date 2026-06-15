"use client";

import { useState, useTransition } from "react";
import { CourseStatus } from "@prisma/client";
import { updateCourse } from "@/lib/actions/course-actions";
import { useLanguage } from "@/components/LanguageProvider";
import { COURSE_LEVEL_OPTIONS, COURSE_LEVELS } from "@/lib/i18n";
import type { InstructorInput } from "@/lib/validators/course";
import { AvatarUpload } from "@/components/educator/AvatarUpload";

interface CourseUpdateFormProps {
  courseId: string;
  slug: string;
  level?: string | null;
  titleEn: string;
  titlePs: string;
  titleDa?: string | null;
  descriptionEn?: string | null;
  descriptionPs?: string | null;
  descriptionDa?: string | null;
  isPaid?: boolean;
  priceCents?: number | null;
  status: CourseStatus;
  instructors: InstructorInput[];
}

async function fetchTranslation(text: string, context: string) {
  const res = await fetch("/api/educator/translate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context }),
  });
  if (!res.ok) return null;
  const payload = await res.json() as { ok: boolean; data?: { ps?: string; fa?: string } };
  return payload.ok ? (payload.data ?? null) : null;
}

function TBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[9px] font-black text-[var(--muted)] transition hover:border-[#0f766e]/50 hover:text-[#0f766e] disabled:opacity-50"
    >
      {loading ? (
        <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : "AI"}{loading ? "" : " Translate"}
    </button>
  );
}

const pill = "text-[10px] font-black uppercase tracking-[1.2px]";
const inputSm = "h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";
const sectionHeader = "text-[10px] font-black uppercase tracking-[1.4px] text-[#0f766e]";

const emptyInstructor = (): InstructorInput => ({
  name: "", username: "", title: undefined, titlePs: undefined, titleDa: undefined,
  bio: undefined, bioPs: undefined, bioDa: undefined,
  avatarUrl: undefined, linkedinUrl: undefined, youtubeUrl: undefined,
});

export function CourseUpdateForm({
  courseId, slug, level, titleEn, titlePs, titleDa,
  descriptionEn, descriptionPs, descriptionDa, isPaid, priceCents, status,
  instructors: initialInstructors,
}: CourseUpdateFormProps) {
  const { t } = useLanguage();

  const [form, setForm] = useState({
    slug,
    level: level ?? "",
    titleEn,
    titlePs,
    titleDa: titleDa ?? "",
    descriptionEn: descriptionEn ?? "",
    descriptionPs: descriptionPs ?? "",
    descriptionDa: descriptionDa ?? "",
    isPaid: Boolean(isPaid),
    priceUsd: priceCents ? (priceCents / 100).toFixed(2) : "",
  });

  const [instructors, setInstructors] = useState<InstructorInput[]>(
    initialInstructors.length > 0 ? initialInstructors : [emptyInstructor()]
  );

  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Translation loading states
  const [translatTitle, setTranslatTitle] = useState(false);
  const [translatDesc, setTranslatDesc] = useState(false);
  const [translatInstTitle, setTranslatInstTitle] = useState<number | null>(null);
  const [translatInstBio, setTranslatInstBio] = useState<number | null>(null);

  function patchForm(patch: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function patchInstructor(idx: number, patch: Partial<InstructorInput>) {
    setInstructors((prev) => prev.map((inst, i) => i === idx ? { ...inst, ...patch } : inst));
  }

  async function translateTitle() {
    if (!form.titleEn.trim()) return;
    setTranslatTitle(true);
    const r = await fetchTranslation(form.titleEn, "courseTitle");
    if (r) patchForm({ titlePs: r.ps ?? form.titlePs, titleDa: r.fa ?? form.titleDa });
    setTranslatTitle(false);
  }

  async function translateDescription() {
    if (!form.descriptionEn.trim()) return;
    setTranslatDesc(true);
    const r = await fetchTranslation(form.descriptionEn, "courseDescription");
    if (r) patchForm({ descriptionPs: r.ps ?? form.descriptionPs, descriptionDa: r.fa ?? form.descriptionDa });
    setTranslatDesc(false);
  }

  async function translateInstructorTitle(idx: number) {
    const text = instructors[idx]?.title?.trim();
    if (!text) return;
    setTranslatInstTitle(idx);
    const r = await fetchTranslation(text, "instructorTitle");
    if (r) patchInstructor(idx, { titlePs: r.ps ?? instructors[idx].titlePs, titleDa: r.fa ?? instructors[idx].titleDa });
    setTranslatInstTitle(null);
  }

  async function translateInstructorBio(idx: number) {
    const text = instructors[idx]?.bio?.trim();
    if (!text) return;
    setTranslatInstBio(idx);
    const r = await fetchTranslation(text, "instructorBio");
    if (r) patchInstructor(idx, { bioPs: r.ps ?? instructors[idx].bioPs, bioDa: r.fa ?? instructors[idx].bioDa });
    setTranslatInstBio(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCourse({
        courseId,
        slug: form.slug,
        level: form.level as "" | "beginner" | "intermediate" | "advanced",
        titleEn: form.titleEn,
        titlePs: form.titlePs,
        titleDa: form.titleDa,
        descriptionEn: form.descriptionEn,
        descriptionPs: form.descriptionPs,
        descriptionDa: form.descriptionDa,
        isPaid: form.isPaid,
        priceCents: form.isPaid ? Math.round(Number(form.priceUsd) * 100) : undefined,
        instructors,
      });
      setMessage(result.ok ? t.courseUpdated : result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">

      {/* ── Section: Basic Info ───────────────────────────────── */}
      <div className="grid gap-4">
        <p className={sectionHeader}>{t.courseSettings}</p>

        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className={`${pill} text-[var(--muted)]`}>{t.slugLabel}</span>
          </div>
          <input className={inputSm} value={form.slug} onChange={(e) => patchForm({ slug: e.target.value })} placeholder="course-slug" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.levelLabel}</span>
            <select
              value={form.level}
              onChange={(e) => patchForm({ level: e.target.value })}
              className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold outline-none focus:border-[#0f766e]"
            >
              <option value="">{t.noLevelOption}</option>
              {COURSE_LEVEL_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {COURSE_LEVELS[key].en} / {COURSE_LEVELS[key].ps} / {COURSE_LEVELS[key].fa}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.currentStatusLabel}</span>
            <input value={status} readOnly className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--muted)]" />
          </div>
        </div>
      </div>

      {/* ── Section: Title ───────────────────────────────────── */}
      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <p className={sectionHeader}>{t.englishTitle}</p>
          <TBtn loading={translatTitle} onClick={() => void translateTitle()} />
        </div>
        <input className={inputSm} value={form.titleEn} onChange={(e) => patchForm({ titleEn: e.target.value })} placeholder="Course title in English" />
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.pashtoTitle}</span>
            <input dir="rtl" className={`${inputSm} ${translatTitle ? "opacity-50" : ""}`} value={form.titlePs} onChange={(e) => patchForm({ titlePs: e.target.value })} placeholder="د کورس سرلیک" />
          </div>
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.dariTitle}</span>
            <input dir="rtl" className={`${inputSm} ${translatTitle ? "opacity-50" : ""}`} value={form.titleDa} onChange={(e) => patchForm({ titleDa: e.target.value })} placeholder="عنوان دری" />
          </div>
        </div>
      </div>

      {/* ── Section: Description ─────────────────────────────── */}
      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <p className={sectionHeader}>{t.englishDescLabel}</p>
          <TBtn loading={translatDesc} onClick={() => void translateDescription()} />
        </div>
        <textarea
          rows={3}
          className={`min-h-[80px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10`}
          value={form.descriptionEn}
          onChange={(e) => patchForm({ descriptionEn: e.target.value })}
          placeholder="Course summary in English"
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.pashtoDescLabel}</span>
            <textarea
              dir="rtl"
              rows={3}
              className={`min-h-[70px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[#0f766e] ${translatDesc ? "opacity-50" : ""}`}
              value={form.descriptionPs}
              onChange={(e) => patchForm({ descriptionPs: e.target.value })}
              placeholder="پدې کورس کې څه زده کوئ"
            />
          </div>
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.dariDescLabel}</span>
            <textarea
              dir="rtl"
              rows={3}
              className={`min-h-[70px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[#0f766e] ${translatDesc ? "opacity-50" : ""}`}
              value={form.descriptionDa}
              onChange={(e) => patchForm({ descriptionDa: e.target.value })}
              placeholder="خلاصه‌ی کورس"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Pricing ─────────────────────────────────── */}
      <div className="grid gap-3">
        <p className={sectionHeader}>{t.cwPricingQuestion}</p>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={form.isPaid}
            onChange={(e) => patchForm({ isPaid: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--border)] text-[#0f766e]"
          />
          <span>
            {t.paidCourseLabel}
            <span className="mt-0.5 block text-xs font-medium text-[var(--muted)]">{t.paidCourseHint}</span>
          </span>
        </label>
        {form.isPaid && (
          <div className="grid gap-1">
            <span className={`${pill} text-[var(--muted)]`}>{t.priceUsdLabel}</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={form.priceUsd}
              onChange={(e) => patchForm({ priceUsd: e.target.value })}
              placeholder="29.00"
              className={inputSm}
            />
          </div>
        )}
      </div>

      {/* ── Section: Instructors ─────────────────────────────── */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <p className={sectionHeader}>{t.instructors}</p>
          <button
            type="button"
            onClick={() => setInstructors((prev) => [...prev, emptyInstructor()])}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#0f766e]/60 px-3 py-1.5 text-[10px] font-black text-[#0f766e] transition hover:bg-teal-50"
          >
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            {t.addInstructor}
          </button>
        </div>

        {instructors.map((inst, idx) => (
          <div key={idx} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <span className={`${pill} text-[#0f766e]`}>{t.instructors} {idx + 1}</span>
              {instructors.length > 1 && (
                <button
                  type="button"
                  onClick={() => setInstructors((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-[10px] font-black text-red-400 hover:underline"
                >
                  {t.removeInstructor}
                </button>
              )}
            </div>

            {/* Avatar + Name + Username */}
            <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
              <AvatarUpload
                name={inst.name}
                currentUrl={inst.avatarUrl}
                onChange={(url) => patchInstructor(idx, { avatarUrl: url || undefined })}
              />
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.displayNameLabel} *</span>
                  <input className={inputSm} value={inst.name} onChange={(e) => patchInstructor(idx, { name: e.target.value })} placeholder="Instructor name" />
                </div>
                <div className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.username} *</span>
                  <input className={inputSm} value={inst.username} onChange={(e) => patchInstructor(idx, { username: e.target.value })} placeholder="instructor-username" />
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between">
                <span className={`${pill} text-[var(--muted)]`}>{t.professionalTitleEn}</span>
                <TBtn loading={translatInstTitle === idx} onClick={() => void translateInstructorTitle(idx)} />
              </div>
              <input className={inputSm} value={inst.title ?? ""} onChange={(e) => patchInstructor(idx, { title: e.target.value || undefined })} placeholder="Senior Data Scientist" />
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.professionalTitlePs}</span>
                  <input dir="rtl" className={`${inputSm} ${translatInstTitle === idx ? "opacity-50" : ""}`} value={inst.titlePs ?? ""} onChange={(e) => patchInstructor(idx, { titlePs: e.target.value || undefined })} placeholder="د مسلک سرلیک" />
                </div>
                <div className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.professionalTitleDa}</span>
                  <input dir="rtl" className={`${inputSm} ${translatInstTitle === idx ? "opacity-50" : ""}`} value={inst.titleDa ?? ""} onChange={(e) => patchInstructor(idx, { titleDa: e.target.value || undefined })} placeholder="عنوان حرفه‌ای" />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between">
                <span className={`${pill} text-[var(--muted)]`}>{t.bioEnLabel}</span>
                <TBtn loading={translatInstBio === idx} onClick={() => void translateInstructorBio(idx)} />
              </div>
              <textarea rows={2} className="min-h-[60px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[#0f766e]" value={inst.bio ?? ""} onChange={(e) => patchInstructor(idx, { bio: e.target.value || undefined })} />
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.bioPsLabel}</span>
                  <textarea dir="rtl" rows={2} className={`min-h-[55px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[#0f766e] ${translatInstBio === idx ? "opacity-50" : ""}`} value={inst.bioPs ?? ""} onChange={(e) => patchInstructor(idx, { bioPs: e.target.value || undefined })} />
                </div>
                <div className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.bioDaLabel}</span>
                  <textarea dir="rtl" rows={2} className={`min-h-[55px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[#0f766e] ${translatInstBio === idx ? "opacity-50" : ""}`} value={inst.bioDa ?? ""} onChange={(e) => patchInstructor(idx, { bioDa: e.target.value || undefined })} />
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <span className={`${pill} text-[var(--muted)]`}>{t.linkedinUrlLabel}</span>
                <input className={inputSm} value={inst.linkedinUrl ?? ""} onChange={(e) => patchInstructor(idx, { linkedinUrl: e.target.value || undefined })} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="grid gap-1">
                <span className={`${pill} text-[var(--muted)]`}>{t.youtubeUrlLabel}</span>
                <input className={inputSm} value={inst.youtubeUrl ?? ""} onChange={(e) => patchInstructor(idx, { youtubeUrl: e.target.value || undefined })} placeholder="https://youtube.com/..." />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Save ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f766e] px-6 text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-wait disabled:opacity-70"
        >
          {isPending ? t.saving : t.saveCourse}
        </button>
        {message && (
          <p className={`text-sm font-semibold ${message === t.courseUpdated ? "text-[#0f766e]" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>

    </form>
  );
}
