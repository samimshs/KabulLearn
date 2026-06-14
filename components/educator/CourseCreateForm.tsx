"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { COURSE_LEVEL_OPTIONS, COURSE_LEVELS } from "@/lib/i18n";
import type { InstructorInput } from "@/lib/validators/course";
import { AvatarUpload } from "@/components/educator/AvatarUpload";

type CourseField = "slug" | "level" | "titleEn" | "titlePs" | "titleDa" | "descriptionEn" | "descriptionPs" | "descriptionDa" | "priceCents";

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

type InstructorProfile = InstructorInput & { id?: string; isPrimary?: boolean; source?: "current-user" | "platform" | "external" };

type InstructorSearchResult = InstructorProfile & { id: string };

const emptyManualInstructor = (): InstructorInput => ({ name: "", username: "", bio: undefined, avatarUrl: undefined });

function slugifyName(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44);
  return `${slug || "external-instructor"}-${Date.now().toString(36)}`;
}

function InstructorAvatar({ instructor }: { instructor: InstructorInput }) {
  const initials = instructor.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-black text-[var(--brand)]">
      {instructor.avatarUrl ? <img src={instructor.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
    </span>
  );
}

export function CourseCreateForm({ className = "pr-card grid gap-4 p-5 lg:p-6" }: { className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const [primaryInstructor, setPrimaryInstructor] = useState<InstructorProfile | null>(null);
  const [coInstructors, setCoInstructors] = useState<InstructorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allEducators, setAllEducators] = useState<InstructorSearchResult[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInstructor, setManualInstructor] = useState<InstructorInput>(emptyManualInstructor());

  const instructors = useMemo(
    () => primaryInstructor ? [primaryInstructor, ...coInstructors] : coInstructors,
    [primaryInstructor, coInstructors]
  );

  const availableEducators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEducators.filter((e) => {
      if (e.username === primaryInstructor?.username) return false;
      if (coInstructors.some((c) => c.username === e.username)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        (e.title?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allEducators, searchQuery, primaryInstructor, coInstructors]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/educator/profile-context")
      .then((res) => res.json())
      .then((payload: { ok: boolean; data?: InstructorProfile }) => {
        if (cancelled || !payload.ok || !payload.data) return;
        setPrimaryInstructor({ ...payload.data, isPrimary: true, source: "current-user" });
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch("/api/educator/instructors/search?q=")
      .then((res) => res.json())
      .then((payload: { ok: boolean; data?: InstructorSearchResult[] }) => {
        if (payload.ok) setAllEducators(payload.data ?? []);
      })
      .catch(() => null);
  }, []);

  function addPlatformInstructor(instructor: InstructorSearchResult) {
    if (primaryInstructor?.username === instructor.username || coInstructors.some((item) => item.username === instructor.username)) return;
    setCoInstructors((prev) => [...prev, { ...instructor, source: "platform" }]);
    setSearchQuery("");
  }

  function addManualInstructor() {
    const name = manualInstructor.name.trim();
    if (!name) return;
    setCoInstructors((prev) => [
      ...prev,
      {
        ...manualInstructor,
        name,
        username: manualInstructor.username || slugifyName(name),
        bio: manualInstructor.bio?.trim() || undefined,
        avatarUrl: manualInstructor.avatarUrl || undefined,
        source: "external"
      }
    ]);
    setManualInstructor(emptyManualInstructor());
    setManualOpen(false);
  }

  function removeCoInstructor(username: string) {
    setCoInstructors((prev) => prev.filter((inst) => inst.username !== username));
  }

  function validate(slug: string, titleEn: string, titlePs: string, titleDa: string, descriptionEn: string, descriptionPs: string, descriptionDa: string, isPaid: boolean, priceUsd: string) {
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
    if (isPaid) {
      const price = Number(priceUsd);
      if (!Number.isFinite(price) || price < 1) next.priceCents = "Enter a price of at least $1.";
    }

    if (!primaryInstructor?.name.trim()) {
      next.instructors = "Your educator profile must be loaded before creating a course.";
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
    const isPaid = formData.get("isPaid") === "on";
    const priceUsd = (formData.get("priceUsd") as string || "").trim();

    const localErrors = validate(slug, titleEn, titlePs, titleDa, descriptionEn, descriptionPs, descriptionDa, isPaid, priceUsd);
    setFieldErrors(localErrors);
    setMessage("");

    if (Object.keys(localErrors).length > 0) {
      setMessage(t.checkFieldsAndRetry);
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
            isPaid,
            priceCents: isPaid ? Math.round(Number(priceUsd) * 100) : undefined,
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
        setCoInstructors([]);
        setMessage(t.courseDraftCreated);
        router.refresh();
        if (result.data?.courseId) {
          router.push(`/educator/courses/${encodeURIComponent(result.data.courseId)}`);
        }
      } catch {
        setMessage(t.couldNotCreateCourse);
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="pr-label">
          {t.slugLabel}
          <input name="slug" placeholder="basic-computer-skills" required className={fieldClass(Boolean(fieldErrors.slug))} />
          <span className="text-xs font-[600] leading-5 text-[var(--muted)]">{t.slugHint}</span>
          <FieldError message={fieldErrors.slug} />
        </label>
        <label className="pr-label">
          {t.levelLabel}
          <select name="level" className={fieldClass(false)}>
            <option value="">{t.noLevelOption}</option>
            {COURSE_LEVEL_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {COURSE_LEVELS[key].en} / {COURSE_LEVELS[key].ps} / {COURSE_LEVELS[key].fa}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="pr-label">
          {t.englishTitle}
          <input name="titleEn" required className={fieldClass(Boolean(fieldErrors.titleEn))} />
          <FieldError message={fieldErrors.titleEn} />
        </label>
        <label className="pr-label">
          {t.pashtoTitle}
          <input name="titlePs" required dir="rtl" className={fieldClass(Boolean(fieldErrors.titlePs))} />
          <FieldError message={fieldErrors.titlePs} />
        </label>
        <label className="pr-label md:col-span-2">
          {t.dariTitle}
          <input name="titleDa" required dir="rtl" className={fieldClass(Boolean(fieldErrors.titleDa))} />
          <FieldError message={fieldErrors.titleDa} />
        </label>
      </div>

      <label className="pr-label">
        {t.englishDescLabel}
        <textarea name="descriptionEn" required rows={3} className={`${fieldClass(Boolean(fieldErrors.descriptionEn))} leading-6`} />
        <FieldError message={fieldErrors.descriptionEn} />
      </label>
      <label className="pr-label">
        {t.pashtoDescLabel}
        <textarea name="descriptionPs" required rows={3} dir="rtl" className={`${fieldClass(Boolean(fieldErrors.descriptionPs))} leading-6`} />
        <FieldError message={fieldErrors.descriptionPs} />
      </label>
      <label className="pr-label">
        {t.dariDescLabel}
        <textarea name="descriptionDa" required rows={3} dir="rtl" className={`${fieldClass(Boolean(fieldErrors.descriptionDa))} leading-6`} />
        <FieldError message={fieldErrors.descriptionDa} />
      </label>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px]">
        <label className="flex items-start gap-3 text-sm font-[800] text-slate-800">
          <input name="isPaid" type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand)]" />
          <span>
            {t.paidCourseLabel}
            <span className="mt-1 block text-xs font-[600] leading-5 text-slate-500">{t.paidCourseHint}</span>
          </span>
        </label>
        <label className="pr-label">
          {t.priceUsdLabel}
          <input name="priceUsd" type="number" inputMode="decimal" min="1" step="0.01" placeholder="29.00" className={fieldClass(Boolean(fieldErrors.priceCents))} />
          <FieldError message={fieldErrors.priceCents} />
        </label>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[1.4px] text-slate-950">{t.instructors}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{t.publicAuthorHint}</p>
          {fieldErrors.instructors && <FieldError message={fieldErrors.instructors} />}
        </div>

        {primaryInstructor ? (
          <article className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <InstructorAvatar instructor={primaryInstructor} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-black text-slate-950">{primaryInstructor.name}</h3>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--brand)]">
                  {t.primaryInstructorBadge}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                {primaryInstructor.bio || t.profileAttachedHint}
              </p>
            </div>
          </article>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500">
            {t.loadingProfile}
          </div>
        )}

        {coInstructors.length > 0 ? (
          <div className="grid gap-3">
            {coInstructors.map((inst) => (
              <article key={inst.username} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <InstructorAvatar instructor={inst} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-black text-slate-950">{inst.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                      {inst.source === "platform" ? t.platformEducatorBadge : t.externalInstructorBadge}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{inst.bio || t.noBioAddedYet}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCoInstructor(inst.username)}
                  className="rounded-lg px-2.5 py-1 text-xs font-black text-[var(--danger)] transition hover:bg-[var(--danger-50)]"
                >
                  {t.removeInstructor}
                </button>
              </article>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm font-black text-slate-800">{t.addCoInstructor}</p>
            <button
              type="button"
              onClick={() => setManualOpen((open) => !open)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              {t.addExternalManually}
            </button>
          </div>

          {/* Search + in-flow list */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="relative border-b border-slate-200">
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlatformEducators}
                className="h-10 w-full bg-white pl-9 pr-3 text-sm font-semibold text-slate-950 outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {allEducators.length === 0 ? (
                <p className="px-4 py-4 text-center text-sm font-[600] text-slate-400">No other educators on the platform yet.</p>
              ) : availableEducators.length === 0 ? (
                <p className="px-4 py-4 text-center text-sm font-[600] text-slate-400">No educators match your search.</p>
              ) : (
                availableEducators.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => addPlatformInstructor(result)}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-start transition last:border-0 hover:bg-blue-50"
                  >
                    <InstructorAvatar instructor={result} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{result.name}</span>
                      <span className="block truncate text-xs font-semibold text-slate-500">{result.title || result.username}</span>
                    </span>
                    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[var(--brand)]" fill="none" aria-hidden="true">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>

          {manualOpen ? (
            <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-800">
                {t.displayNameLabel}
                <input
                  value={manualInstructor.name}
                  onChange={(event) => setManualInstructor((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="grid gap-2 text-sm font-black text-slate-800">
                {t.profilePhoto}
                <AvatarUpload
                  name={manualInstructor.name}
                  currentUrl={manualInstructor.avatarUrl}
                  onChange={(url) => setManualInstructor((prev) => ({ ...prev, avatarUrl: url || undefined }))}
                />
              </div>
              <label className="grid gap-2 text-sm font-black text-slate-800 md:col-span-2">
                {t.bioEnLabel}
                <textarea
                  value={manualInstructor.bio ?? ""}
                  onChange={(event) => setManualInstructor((prev) => ({ ...prev, bio: event.target.value || undefined }))}
                  rows={3}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
                <button
                  type="button"
                  onClick={addManualInstructor}
                  disabled={!manualInstructor.name.trim()}
                  className="h-11 rounded-xl bg-[var(--brand)] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--brand)] md:col-span-2"
                >
                  {t.addInstructor}
                </button>
            </div>
          ) : null}
        </div>
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
