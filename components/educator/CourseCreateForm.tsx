"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { COURSE_LEVEL_OPTIONS, COURSE_LEVELS } from "@/lib/i18n";
import type { InstructorInput } from "@/lib/validators/course";
import { AvatarUpload } from "@/components/educator/AvatarUpload";

type CourseField = "slug" | "level" | "titleEn" | "titlePs" | "titleDa" | "descriptionEn" | "descriptionPs" | "descriptionDa";

type FieldErrors = Partial<Record<CourseField, string>> & { instructors?: string; [key: string]: string | undefined };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const urlPattern = /^https?:\/\//;

function fieldClass(hasError: boolean) {
  return `pr-input ${hasError ? "border-[var(--danger)] bg-[var(--danger-50)] focus:border-[var(--danger)] focus:shadow-[0_0_0_4px_rgba(196,43,43,0.14)]" : ""}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="rounded-[var(--radius-sm)] border border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] px-3 py-2 text-xs font-[800] leading-5 text-[var(--danger)]">
      {message}
    </span>
  );
}

const emptyInstructor = (): InstructorInput => ({
  name: "", username: "", title: undefined, bio: undefined,
  avatarUrl: undefined, linkedinUrl: undefined, youtubeUrl: undefined
});

export function CourseCreateForm({ className = "pr-card grid gap-4 p-5 lg:p-6" }: { className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const [instructors, setInstructors] = useState<InstructorInput[]>([emptyInstructor()]);

  function updateInstructor(idx: number, patch: Partial<InstructorInput>) {
    setInstructors((prev) => prev.map((inst, i) => i === idx ? { ...inst, ...patch } : inst));
  }

  function addInstructor() {
    setInstructors((prev) => [...prev, emptyInstructor()]);
  }

  function removeInstructor(idx: number) {
    setInstructors((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate(slug: string, titleEn: string, titlePs: string, titleDa: string, descriptionEn: string, descriptionPs: string, descriptionDa: string) {
    const next: FieldErrors = {};

    if (!slug) {
      next.slug = "Slug is required. Use a short URL name like basic-computer-skills.";
    } else if (slug.startsWith("http") || slug.includes("/") || slug.includes(".")) {
      next.slug = "Do not paste a link here. Use lowercase words separated by hyphens.";
    } else if (slug.length < 3 || slug.length > 80 || !slugPattern.test(slug)) {
      next.slug = "Use lowercase letters, numbers, and hyphens only. No spaces or symbols.";
    }

    if (!titleEn.trim()) next.titleEn = "Enter the English course title.";
    if (!titlePs.trim()) next.titlePs = "Enter the Pashto course title.";
    if (!titleDa.trim()) next.titleDa = "Enter the Dari course title.";
    if (!descriptionEn.trim()) next.descriptionEn = "Enter an English course description.";
    if (!descriptionPs.trim()) next.descriptionPs = "Enter a Pashto course description.";
    if (!descriptionDa.trim()) next.descriptionDa = "Enter a Dari course description.";

    // Validate instructors
    if (instructors.length === 0 || !instructors[0].name.trim()) {
      next.instructors = "Add at least one instructor.";
    }
    for (const [i, inst] of instructors.entries()) {
      if (!inst.name.trim()) next[`instructor_${i}_name`] = "Name is required.";
      if (!inst.username.trim()) {
        next[`instructor_${i}_username`] = "Username is required.";
      } else if (!slugPattern.test(inst.username.trim())) {
        next[`instructor_${i}_username`] = "Use lowercase letters, numbers, and hyphens only.";
      }
      if (inst.linkedinUrl && !urlPattern.test(inst.linkedinUrl)) next[`instructor_${i}_linkedinUrl`] = "Use a full LinkedIn URL starting with https://";
      if (inst.youtubeUrl && !urlPattern.test(inst.youtubeUrl)) next[`instructor_${i}_youtubeUrl`] = "Use a full YouTube URL starting with https://";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const slug = (formData.get("slug") as string || "").trim();
    const level = (formData.get("level") as string || "");
    const titleEn = (formData.get("titleEn") as string || "").trim();
    const titlePs = (formData.get("titlePs") as string || "").trim();
    const titleDa = (formData.get("titleDa") as string || "").trim();
    const descriptionEn = (formData.get("descriptionEn") as string || "").trim();
    const descriptionPs = (formData.get("descriptionPs") as string || "").trim();
    const descriptionDa = (formData.get("descriptionDa") as string || "").trim();

    const localErrors = validate(slug, titleEn, titlePs, titleDa, descriptionEn, descriptionPs, descriptionDa);
    setFieldErrors(localErrors);
    setMessage("");

    if (Object.keys(localErrors).length > 0) {
      setMessage("Check the highlighted fields and try again.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/educator/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug, level, titleEn, titlePs, titleDa,
            descriptionEn, descriptionPs, descriptionDa,
            instructors: instructors.map((inst) => ({
              name: inst.name.trim(),
              username: inst.username.trim(),
              title: inst.title?.trim() || undefined,
              bio: inst.bio?.trim() || undefined,
              avatarUrl: inst.avatarUrl?.trim() || undefined,
              linkedinUrl: inst.linkedinUrl?.trim() || undefined,
              youtubeUrl: inst.youtubeUrl?.trim() || undefined,
            }))
          })
        });
        const result = await response.json() as { ok: boolean; error?: string; data?: { courseId: string } };

        if (response.status === 401) { router.push("/login?callbackUrl=%2Feducator"); return; }

        if (!response.ok || !result.ok) {
          setMessage(result.error ?? "Could not create the course right now.");
          return;
        }

        formRef.current?.reset();
        setFieldErrors({});
        setInstructors([emptyInstructor()]);
        setMessage("Course draft created. Opening the content editor...");
        router.refresh();
        if (result.data?.courseId) {
          router.push(`/educator/courses/${encodeURIComponent(result.data.courseId)}`);
        }
      } catch {
        setMessage("Could not create the course right now. Please try again.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className}>
      <div>
        <p className="pr-eyebrow">{t.newDraft}</p>
        <h2 className="pr-h2 mt-2">{t.startCourseDraft}</h2>
        <p className="mt-2 text-sm font-[500] leading-6 text-[var(--muted)]">{t.startCourseDraftHint}</p>
      </div>

      {/* Slug + Level */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="pr-label">
          Slug
          <input name="slug" placeholder="basic-computer-skills" required className={fieldClass(Boolean(fieldErrors.slug))} />
          <span className="text-xs font-[600] leading-5 text-[var(--muted)]">
            URL name only: lowercase letters, numbers, hyphens.
          </span>
          <FieldError message={fieldErrors.slug} />
        </label>
        <label className="pr-label">
          Level
          <select name="level" className={fieldClass(false)}>
            <option value="">— Select level —</option>
            {COURSE_LEVEL_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {COURSE_LEVELS[key].en} / {COURSE_LEVELS[key].ps} / {COURSE_LEVELS[key].fa}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Titles */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="pr-label">
          Title English
          <input name="titleEn" required className={fieldClass(Boolean(fieldErrors.titleEn))} />
          <FieldError message={fieldErrors.titleEn} />
        </label>
        <label className="pr-label">
          Title Pashto
          <input name="titlePs" required dir="rtl" className={fieldClass(Boolean(fieldErrors.titlePs))} />
          <FieldError message={fieldErrors.titlePs} />
        </label>
        <label className="pr-label md:col-span-2">
          Title Dari
          <input name="titleDa" required dir="rtl" className={fieldClass(Boolean(fieldErrors.titleDa))} />
          <FieldError message={fieldErrors.titleDa} />
        </label>
      </div>

      {/* Descriptions */}
      <label className="pr-label">
        Description English
        <textarea name="descriptionEn" required rows={3} className={`${fieldClass(Boolean(fieldErrors.descriptionEn))} leading-6`} />
        <FieldError message={fieldErrors.descriptionEn} />
      </label>
      <label className="pr-label">
        Description Pashto
        <textarea name="descriptionPs" required rows={3} dir="rtl" className={`${fieldClass(Boolean(fieldErrors.descriptionPs))} leading-6`} />
        <FieldError message={fieldErrors.descriptionPs} />
      </label>
      <label className="pr-label">
        Description Dari
        <textarea name="descriptionDa" required rows={3} dir="rtl" className={`${fieldClass(Boolean(fieldErrors.descriptionDa))} leading-6`} />
        <FieldError message={fieldErrors.descriptionDa} />
      </label>

      {/* Instructors */}
      <div className="grid gap-3">
        <div>
          <p className="text-sm font-[900] uppercase tracking-[1.4px] text-[var(--ink)]">{t.instructors}</p>
          <p className="mt-1 text-xs font-[600] leading-5 text-[var(--muted)]">{t.publicAuthorHint}</p>
          {fieldErrors.instructors && <FieldError message={fieldErrors.instructors} />}
        </div>
        {instructors.map((inst, idx) => (
          <div key={idx} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-[800] uppercase tracking-[1.2px] text-[var(--brand)]">
                Instructor {idx + 1}{idx === 0 ? " (primary)" : ""}
              </p>
              {instructors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstructor(idx)}
                  className="rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-[800] text-[var(--danger)] transition hover:bg-[var(--danger-50)]"
                >
                  {t.removeInstructor}
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="pr-label">
                Name *
                <input
                  value={inst.name}
                  onChange={(e) => updateInstructor(idx, { name: e.target.value })}
                  placeholder="Sami Samim"
                  className={fieldClass(Boolean(fieldErrors[`instructor_${idx}_name`]))}
                />
                <FieldError message={fieldErrors[`instructor_${idx}_name`]} />
              </label>
              <label className="pr-label">
                Username *
                <input
                  value={inst.username}
                  onChange={(e) => updateInstructor(idx, { username: e.target.value })}
                  placeholder="sami-samim"
                  className={fieldClass(Boolean(fieldErrors[`instructor_${idx}_username`]))}
                />
                <span className="text-xs font-[600] leading-5 text-[var(--muted)]">
                  Used in public profile URL: /creators/sami-samim
                </span>
                <FieldError message={fieldErrors[`instructor_${idx}_username`]} />
              </label>
              <label className="pr-label">
                Professional title
                <input
                  value={inst.title ?? ""}
                  onChange={(e) => updateInstructor(idx, { title: e.target.value || undefined })}
                  placeholder="Senior Data Scientist"
                  className="pr-input"
                />
              </label>
              <div className="pr-label">
                Profile photo
                <AvatarUpload
                  name={inst.name}
                  currentUrl={inst.avatarUrl}
                  onChange={(url) => updateInstructor(idx, { avatarUrl: url || undefined })}
                />
              </div>
              <label className="pr-label md:col-span-2">
                Bio
                <textarea
                  value={inst.bio ?? ""}
                  onChange={(e) => updateInstructor(idx, { bio: e.target.value || undefined })}
                  rows={2}
                  className="pr-input leading-6"
                />
              </label>
              <label className="pr-label">
                LinkedIn URL
                <input
                  value={inst.linkedinUrl ?? ""}
                  onChange={(e) => updateInstructor(idx, { linkedinUrl: e.target.value || undefined })}
                  placeholder="https://www.linkedin.com/in/..."
                  className={fieldClass(Boolean(fieldErrors[`instructor_${idx}_linkedinUrl`]))}
                />
                <FieldError message={fieldErrors[`instructor_${idx}_linkedinUrl`]} />
              </label>
              <label className="pr-label">
                YouTube URL
                <input
                  value={inst.youtubeUrl ?? ""}
                  onChange={(e) => updateInstructor(idx, { youtubeUrl: e.target.value || undefined })}
                  placeholder="https://www.youtube.com/..."
                  className={fieldClass(Boolean(fieldErrors[`instructor_${idx}_youtubeUrl`]))}
                />
                <FieldError message={fieldErrors[`instructor_${idx}_youtubeUrl`]} />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addInstructor}
          className="flex items-center gap-2 self-start rounded-[var(--radius)] border border-dashed border-[var(--border)] px-4 py-2.5 text-sm font-[800] text-[var(--brand)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-50)]"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          {t.addInstructor}
        </button>
      </div>

      {message ? (
        <p className={`rounded-[var(--radius)] border px-4 py-3 text-sm font-[800] ${Object.keys(fieldErrors).length > 0 ? "border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] text-[var(--danger)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)]"}`}>
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="pr-btn-primary">
        {isPending ? t.creating : t.createDraft}
      </button>
    </form>
  );
}
