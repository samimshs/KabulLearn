"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeLevel } from "@/lib/i18n";
import { getVisitedLessons } from "@/lib/progress";

export type CourseCardRow = {
  id: string;
  titleEn: string;
  titlePs: string;
  titleDa?: string | null;
  descriptionEn: string;
  descriptionPs: string;
  descriptionDa?: string | null;
  level?: string | null;
  hasCertificate?: boolean;
  modules: Array<{ id: string; order: number; lessons: Array<{ id: string; order: number }> }>;
  enrollmentCount?: number;
  isEnrolled?: boolean;
  progress?: { completedModules: number; totalModules: number };
  rating?: { average: number; count: number };
  instructors?: Array<{ name: string; username: string; avatarUrl: string | null }>;
};

const THUMB_CONFIGS = [
  {
    gradient: "linear-gradient(135deg,#0057FF 0%,#0E7490 100%)",
    pattern: (
      <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 35 }).map((_, i) => (
          <circle key={i} cx={(i % 7) * 28 + 14} cy={Math.floor(i / 7) * 28 + 14} r={2.5} fill="white" opacity={0.22} />
        ))}
      </svg>
    ),
  },
  {
    gradient: "linear-gradient(135deg,#18825C 0%,#0E7490 100%)",
    pattern: (
      <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1={i * 22 - 10} y1={0} x2={i * 22 + 130} y2={140} stroke="white" strokeWidth={1.5} opacity={0.18} />
        ))}
      </svg>
    ),
  },
  {
    gradient: "linear-gradient(135deg,#7C3AED 0%,#0057FF 100%)",
    pattern: (
      <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 16 + 8} x2={200} y2={i * 16 + 8} stroke="white" strokeWidth={1} opacity={0.14} />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 16 + 8} y1={0} x2={i * 16 + 8} y2={140} stroke="white" strokeWidth={1} opacity={0.14} />
        ))}
      </svg>
    ),
  },
  {
    gradient: "linear-gradient(135deg,#B06C00 0%,#C42B2B 100%)",
    pattern: (
      <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx={170} cy={-20} r={90} fill="none" stroke="white" strokeWidth={28} opacity={0.1} />
        <circle cx={20} cy={160} r={70} fill="none" stroke="white" strokeWidth={18} opacity={0.1} />
      </svg>
    ),
  },
  {
    gradient: "linear-gradient(135deg,#0E7490 0%,#18825C 100%)",
    pattern: (
      <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 20 }).map((_, i) => {
          const cx = (i % 5) * 38 + 19;
          const cy = Math.floor(i / 5) * 35 + 17;
          return (
            <g key={i} opacity={0.2}>
              <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke="white" strokeWidth={1.5} />
              <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke="white" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
    ),
  },
  {
    gradient: "linear-gradient(135deg,#C42B2B 0%,#7C3AED 100%)",
    pattern: (
      <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <g opacity={0.2}>
          <line x1={30} y1={70} x2={90} y2={35} stroke="white" strokeWidth={1.5} />
          <line x1={90} y1={35} x2={160} y2={60} stroke="white" strokeWidth={1.5} />
          <line x1={160} y1={60} x2={130} y2={110} stroke="white" strokeWidth={1.5} />
          <line x1={130} y1={110} x2={60} y2={105} stroke="white" strokeWidth={1.5} />
          <line x1={60} y1={105} x2={30} y2={70} stroke="white" strokeWidth={1.5} />
          <line x1={90} y1={35} x2={60} y2={105} stroke="white" strokeWidth={1.5} />
          {[{cx:30,cy:70},{cx:90,cy:35},{cx:160,cy:60},{cx:130,cy:110},{cx:60,cy:105}].map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r={5} fill="white" />
          ))}
        </g>
      </svg>
    ),
  },
] as const;

function levelBadgeClass(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("beginner") || l.includes("ابتدایی") || l.includes("لومړنی")) return "pr-badge pr-badge-green";
  if (l.includes("advanced") || l.includes("پیشرفته") || l.includes("پرمختللی")) return "pr-badge pr-badge-gold";
  return "pr-badge";
}

function estimateTime(lessonCount: number): string {
  const mins = lessonCount * 20;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PR";
}

export function CourseCard({ course, index = 0 }: { course: CourseCardRow; index?: number }) {
  const { locale, t } = useLanguage();
  const title =
    locale === "fa" ? (course.titleDa ?? course.titleEn) :
    locale === "ps" ? course.titlePs :
    course.titleEn;
  const desc =
    locale === "fa" ? (course.descriptionDa ?? course.descriptionEn) :
    locale === "ps" ? course.descriptionPs :
    course.descriptionEn;
  const level = localizeLevel(course.level, locale);
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const thumb = THUMB_CONFIGS[index % THUMB_CONFIGS.length];
  const [lessonPct, setLessonPct] = useState<number | null>(null);

  useEffect(() => {
    if (!course.progress) return; // not enrolled — don't show progress
    const allIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    if (allIds.length === 0) return;
    const visited = getVisitedLessons(course.id, allIds);
    setLessonPct(Math.round((visited.size / allIds.length) * 100));
  }, [course.id, course.modules, course.progress]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.28)] hover:shadow-[var(--shadow)]">

      {/* Thumbnail */}
      <div className="relative h-24 overflow-hidden" style={{ background: thumb.gradient }}>
        {thumb.pattern}
        <span className="absolute bottom-3 start-3 h-0.5 w-8 rounded-full bg-white opacity-60" />
      </div>

      <div className="flex flex-1 flex-col p-4">

        {/* Badge row */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {level ? <span className={levelBadgeClass(level)}>{level}</span> : null}
          {course.hasCertificate && (
            <span className="pr-badge pr-badge-cert">{t.certificateIncluded}</span>
          )}
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
            {course.modules.length} {t.modules}
          </span>
        </div>

        <h2 className="text-[15px] font-[800] leading-[1.3] tracking-[-0.3px] text-[var(--ink)]">{title}</h2>
        <p className="mt-1.5 line-clamp-2 text-[12px] font-[500] leading-[1.6] text-[var(--muted)]">{desc}</p>

        {/* Metadata */}
        {course.enrollmentCount !== undefined ? (
          <p className="mt-2 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted-2)]">
            {lessonCount} {t.lessons}&nbsp;·&nbsp;~{estimateTime(lessonCount)}&nbsp;·&nbsp;{course.enrollmentCount.toLocaleString()} {t.enrolledStudents}
          </p>
        ) : null}

        {course.rating && course.rating.count > 0 ? (
          <p className="mt-1.5 text-[12px] font-[900] text-[var(--ink)]">
            <span className="text-[var(--brand)]">★</span> {course.rating.average.toFixed(1)}
            <span className="font-[700] text-[var(--muted)]"> ({course.rating.count})</span>
          </p>
        ) : null}

        {lessonPct !== null ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-[700]">
              <span className="text-[var(--muted)]">{t.progress}</span>
              <span className="text-[var(--brand)]">{lessonPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-1 rounded-full bg-[var(--brand)] transition-all"
                style={{ width: `${lessonPct}%` }}
                role="progressbar"
                aria-valuenow={lessonPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-auto pt-4">
          <Link href={`/courses/${course.id}`} className="pr-btn-primary w-full">
            {t.viewCourse}
          </Link>

          {course.instructors && course.instructors.length > 0 ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center">
                {course.instructors.slice(0, 4).map((inst, i) => (
                  <Link
                    key={inst.username}
                    href={`/creators/${encodeURIComponent(inst.username)}`}
                    title={inst.name}
                    aria-label={inst.name}
                    className="relative block rounded-full ring-2 ring-[var(--card)] transition hover:z-10 hover:ring-[var(--brand)]"
                    style={{ marginInlineStart: i === 0 ? 0 : "-8px", zIndex: 10 - i }}
                  >
                    {inst.avatarUrl ? (
                      <img
                        src={inst.avatarUrl}
                        alt={inst.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-50)] text-[10px] font-[900] text-[var(--brand)]">
                        {initials(inst.name)}
                      </span>
                    )}
                  </Link>
                ))}
                {course.instructors.length > 4 && (
                  <span
                    className="relative grid h-7 w-7 place-items-center rounded-full bg-[var(--surface)] text-[10px] font-[800] text-[var(--muted)] ring-2 ring-[var(--card)]"
                    style={{ marginInlineStart: "-8px", zIndex: 0 }}
                  >
                    +{course.instructors.length - 4}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
