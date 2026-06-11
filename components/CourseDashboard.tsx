"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { CourseCard, type CourseCardRow } from "@/components/CourseCard";
import { localize, localizeLevel } from "@/lib/i18n";

type CourseModule = {
  id: string; titleEn: string; titlePs: string; titleDa?: string | null; order: number;
  lessons: Array<{ id: string; order: number }>;
};

type CourseRow = CourseCardRow & { modules: CourseModule[]; tagSlugs?: string[] };


export function EducatorCta() {
  const { t } = useLanguage();

  return (
    <section className="pr-panel mt-12 p-7 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="pr-eyebrow">{t.educator}</p>
          <h2 className="pr-h2 mt-2">{t.teachCta}</h2>
          <p className="pr-copy mt-2 max-w-xl">{t.teachCtaSubtitle}</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {[t.teachCtaStep1, t.teachCtaStep2, t.teachCtaStep3, t.teachCtaStep4].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] font-[500] text-[var(--muted)]">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--brand-50)] text-[11px] font-[800] text-[var(--brand)]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch">
          <Link href="/register" className="pr-btn-primary">
            {t.teachCtaButton}
          </Link>
          <Link href="/login?callbackUrl=%2Feducator" className="pr-btn-ghost">
            {t.educatorPortal}
          </Link>
        </div>
      </div>
    </section>
  );
}

type CourseTag = { id: string; slug: string; label: string };

export function CourseDashboard({ courses, dbError, isAuthenticated = false, availableTags = [], activeTag }: { courses: CourseRow[]; dbError?: boolean; isAuthenticated?: boolean; availableTags?: CourseTag[]; activeTag?: string }) {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "az">("popular");

  const allLevels = useMemo(() => {
    const s = new Set<string>();
    courses.forEach((c) => {
      const l = localizeLevel(c.level, locale);
      if (l) s.add(l);
    });
    return [...s].sort();
  }, [courses, locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = courses.filter((c) => {
      const desc  = localize(locale, c.descriptionEn, c.descriptionPs, c.descriptionDa ?? undefined);
      const localizedTitle = localize(locale, c.titleEn, c.titlePs, c.titleDa ?? undefined);
      const titleDa = c.titleDa ?? "";
      const descDa = c.descriptionDa ?? "";
      const level = localizeLevel(c.level, locale);
      const authorName = c.instructors?.[0]?.name ?? "";
      const authorUsername = c.instructors?.[0]?.username ?? "";
      return (
        (!q || localizedTitle.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || titleDa.toLowerCase().includes(q) || descDa.toLowerCase().includes(q) || authorName.toLowerCase().includes(q) || authorUsername.toLowerCase().includes(q))
        && (!levelFilter || level === levelFilter)
      );
    });
    if (sortBy === "az") {
      result.sort((a, b) => {
        const ta = localize(locale, a.titleEn, a.titlePs, a.titleDa ?? undefined);
        const tb = localize(locale, b.titleEn, b.titlePs, b.titleDa ?? undefined);
        return ta.localeCompare(tb);
      });
    } else {
      result.sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0));
    }
    return result;
  }, [courses, query, levelFilter, sortBy, locale]);

  return (
    <>
      {/* ── Discovery Center ────────────────────────────────────── */}
      <div className="mb-8 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">

        {/* Header */}
        <div className="border-b border-[var(--border)] px-6 pt-6 pb-5">
          <p className="pr-eyebrow mb-2">{t.availableCourses}</p>
          <h2 className="pr-h2">{t.discoverCourses}</h2>
        </div>

        {/* Search */}
        <div className="px-6 pt-5">
          <label htmlFor="course-search" className="sr-only">{t.searchPlaceholder}</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-[var(--muted)]">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="course-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pr-input text-[15px]"
              style={{ paddingInlineStart: "2.75rem", paddingBlock: "14px" }}
            />
          </div>
        </div>

        {/* Sort + level filter */}
        <div className="flex flex-wrap items-center gap-2 px-6 pt-3 pb-5">
          {allLevels.length > 0 && (
            <div className="ms-auto flex items-center gap-2">
              <label htmlFor="sort-filter" className="sr-only">{t.sortByLabel}</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "popular" | "az")}
                className="pr-input py-2 text-[13px]"
              >
                <option value="popular">{t.sortMostPopular}</option>
                <option value="az">{t.sortAlphabetical}</option>
              </select>
              <label htmlFor="level-filter" className="sr-only">{t.filterAll}</label>
              <select
                id="level-filter"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="pr-input min-w-[150px] py-2 text-[13px]"
              >
                <option value="">{t.filterAll}</option>
                {allLevels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* DB-backed topic tags */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-6 py-3">
            <span className="text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.filterByCategory}</span>
            <Link
              href="/courses"
              className={`rounded-full border px-3 py-1 text-[12px] font-[700] transition ${
                !activeTag
                  ? "border-[var(--brand)] bg-[rgba(0,87,255,0.08)] text-[var(--brand)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--ink)]"
              }`}
            >
              {t.allCategories}
            </Link>
            {availableTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/courses?tag=${encodeURIComponent(tag.slug)}`}
                className={`rounded-full border px-3 py-1 text-[12px] font-[700] transition ${
                  activeTag === tag.slug
                    ? "border-[var(--brand)] bg-[rgba(0,87,255,0.08)] text-[var(--brand)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--ink)]"
                }`}
              >
                {tag.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* DB error */}
      {dbError && (
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.18)] bg-[var(--warning-50)] px-6 py-4 text-[14px] font-[700] text-[var(--warning)]">
          {t.dbUnavailable} — {t.dbUnavailableHint}
        </div>
      )}

      {/* Course grid */}
      {!dbError && (
        <section aria-label={t.availableCourses} aria-live="polite">
          {filtered.length === 0 ? (
            <div className="pr-muted-box py-16 text-center text-[15px] font-[700] text-[var(--muted)]">
              {courses.length > 0 ? t.noResults : t.noCourses}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} />
              ))}
            </div>
          )}
        </section>
      )}

    </>
  );
}
