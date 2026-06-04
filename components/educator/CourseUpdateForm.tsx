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
  status: CourseStatus;
  instructors: InstructorInput[];
}

const inputCls = "rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";
const emptyInstructor = (): InstructorInput => ({
  name: "", username: "", title: undefined, bio: undefined,
  avatarUrl: undefined, linkedinUrl: undefined, youtubeUrl: undefined
});

export function CourseUpdateForm({
  courseId, slug, level, titleEn, titlePs, titleDa,
  descriptionEn, descriptionPs, descriptionDa, status,
  instructors: initialInstructors,
}: CourseUpdateFormProps) {
  const { t } = useLanguage();
  const [formState, setFormState] = useState({
    slug,
    level: level ?? "",
    titleEn,
    titlePs,
    titleDa: titleDa ?? "",
    descriptionEn: descriptionEn ?? "",
    descriptionPs: descriptionPs ?? "",
    descriptionDa: descriptionDa ?? "",
  });
  const [instructors, setInstructors] = useState<InstructorInput[]>(
    initialInstructors.length > 0 ? initialInstructors : [emptyInstructor()]
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateInstructor(idx: number, patch: Partial<InstructorInput>) {
    setInstructors((prev) => prev.map((inst, i) => i === idx ? { ...inst, ...patch } : inst));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateCourse({
            courseId,
            slug: formState.slug,
            level: formState.level as "" | "beginner" | "intermediate" | "advanced",
            titleEn: formState.titleEn,
            titlePs: formState.titlePs,
            titleDa: formState.titleDa,
            descriptionEn: formState.descriptionEn,
            descriptionPs: formState.descriptionPs,
            descriptionDa: formState.descriptionDa,
            instructors,
          });
          setMessage(result.ok ? t.courseUpdated : result.error);
        });
      }}
      className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4"
    >
      {/* Section header */}
      <div className="grid gap-2">
        <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.courseSettings}</p>
        <p className="text-sm text-[#525f6e]">{t.updateCourseHint}</p>
      </div>

      {/* Slug */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Slug
          <input value={formState.slug} onChange={(e) => setFormState({ ...formState, slug: e.target.value })} placeholder="course-slug" className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Level
          <select
            value={formState.level}
            onChange={(e) => setFormState({ ...formState, level: e.target.value })}
            className={inputCls}
          >
            <option value="">— No level —</option>
            {COURSE_LEVEL_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {COURSE_LEVELS[key].en} / {COURSE_LEVELS[key].ps} / {COURSE_LEVELS[key].fa}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Current status
          <input value={status} readOnly className="rounded-xl border border-stone-200 bg-stone-100 px-3 py-3 text-sm text-[#525f6e]" />
        </label>
      </div>

      {/* Titles */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Title English
          <input value={formState.titleEn} onChange={(e) => setFormState({ ...formState, titleEn: e.target.value })} placeholder="English title" className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Title Pashto
          <input value={formState.titlePs} dir="rtl" onChange={(e) => setFormState({ ...formState, titlePs: e.target.value })} placeholder="د کورس سرلیک" className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a] sm:col-span-2">
          Title Dari
          <input value={formState.titleDa} dir="rtl" onChange={(e) => setFormState({ ...formState, titleDa: e.target.value })} placeholder="عنوان دری کورس" className={inputCls} />
        </label>
      </div>

      {/* Descriptions */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Description English
          <textarea value={formState.descriptionEn} onChange={(e) => setFormState({ ...formState, descriptionEn: e.target.value })} rows={3} placeholder="Course summary in English" className={`min-h-[90px] ${inputCls}`} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Description Pashto
          <textarea value={formState.descriptionPs} dir="rtl" onChange={(e) => setFormState({ ...formState, descriptionPs: e.target.value })} rows={3} placeholder="پدې کورس کې څه زده کوئ" className={`min-h-[90px] ${inputCls}`} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a] sm:col-span-2">
          Description Dari
          <textarea value={formState.descriptionDa} dir="rtl" onChange={(e) => setFormState({ ...formState, descriptionDa: e.target.value })} rows={3} placeholder="خلاصه‌ی کورس به دری" className={`min-h-[90px] ${inputCls}`} />
        </label>
      </div>

      {/* Instructors */}
      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.instructors}</p>
          <p className="text-sm text-[#525f6e]">{t.publicAuthorHint}</p>
        </div>
        {instructors.map((inst, idx) => (
          <div key={idx} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-[800] uppercase tracking-[1.2px] text-[#0f766e]">
                Instructor {idx + 1}{idx === 0 ? " (primary)" : ""}
              </p>
              {instructors.length > 1 && (
                <button
                  type="button"
                  onClick={() => setInstructors((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs font-[800] text-red-600 hover:underline"
                >
                  {t.removeInstructor}
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
                Name *
                <input value={inst.name} onChange={(e) => updateInstructor(idx, { name: e.target.value })} placeholder="Instructor name" className={inputCls} />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
                Username *
                <input value={inst.username} onChange={(e) => updateInstructor(idx, { username: e.target.value })} placeholder="instructor-username" className={inputCls} />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
                Professional title
                <input value={inst.title ?? ""} onChange={(e) => updateInstructor(idx, { title: e.target.value || undefined })} placeholder="Senior Data Scientist" className={inputCls} />
              </label>
              <div className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
                Profile photo
                <AvatarUpload
                  name={inst.name}
                  currentUrl={inst.avatarUrl}
                  onChange={(url) => updateInstructor(idx, { avatarUrl: url || undefined })}
                />
              </div>
              <label className="grid gap-1 text-sm font-medium text-[#3d4a5a] sm:col-span-2">
                Bio
                <textarea value={inst.bio ?? ""} onChange={(e) => updateInstructor(idx, { bio: e.target.value || undefined })} rows={2} className={`min-h-[70px] ${inputCls}`} />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
                LinkedIn URL
                <input value={inst.linkedinUrl ?? ""} onChange={(e) => updateInstructor(idx, { linkedinUrl: e.target.value || undefined })} placeholder="https://linkedin.com/in/..." className={inputCls} />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
                YouTube URL
                <input value={inst.youtubeUrl ?? ""} onChange={(e) => updateInstructor(idx, { youtubeUrl: e.target.value || undefined })} placeholder="https://youtube.com/..." className={inputCls} />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setInstructors((prev) => [...prev, emptyInstructor()])}
          className="flex items-center gap-2 self-start rounded-lg border border-dashed border-[#0f766e] px-3 py-2 text-sm font-[800] text-[#0f766e] transition hover:bg-teal-50"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          {t.addInstructor}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <button type="submit" disabled={isPending} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-wait disabled:opacity-70">
          {isPending ? t.saving : t.saveCourse}
        </button>
        {message ? <p className="text-sm text-[#0f766e]">{message}</p> : null}
      </div>
    </form>
  );
}
