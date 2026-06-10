"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { localize, localizeLevel } from "@/lib/i18n";
import type { RecommendedCourse } from "@/lib/recommendations";

const PALETTE = [
  "linear-gradient(135deg,#0057FF 0%,#0E7490 100%)",
  "linear-gradient(135deg,#18825C 0%,#0E7490 100%)",
  "linear-gradient(135deg,#7C3AED 0%,#0057FF 100%)",
  "linear-gradient(135deg,#B06C00 0%,#C42B2B 100%)",
  "linear-gradient(135deg,#0E7490 0%,#475569 100%)",
  "linear-gradient(135deg,#4338CA 0%,#7C3AED 100%)",
];

function cardGradient(title: string, id: string): string {
  const t = title.toLowerCase();
  if (/data|machine|python|ml|pandas/.test(t)) return PALETTE[0];
  if (/statistic|probability|regression/.test(t)) return PALETTE[1];
  if (/\bai\b|intelligence|neural|deep/.test(t)) return PALETTE[2];
  if (/web|html|css|javascript|frontend/.test(t)) return PALETTE[3];
  if (/computer|hardware|software|basics|digital/.test(t)) return PALETTE[4];
  if (/physic|mechanic|quantum|optic/.test(t)) return PALETTE[5];
  return PALETTE[id.charCodeAt(0) % PALETTE.length];
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 12 12" className="h-3 w-3" fill={n <= Math.round(value) ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="1.2">
          <path d="M6 1l1.2 3.6H11L8.4 6.7l1 3.3L6 8.2 2.6 10l1-3.3L1 4.6h3.8z" />
        </svg>
      ))}
      <span className="ms-1 text-[10px] font-[700] text-[var(--muted)]">{value.toFixed(1)}</span>
    </span>
  );
}

export function RecommendedCourses({ courses }: { courses: RecommendedCourse[] }) {
  const { t, locale } = useLanguage();

  if (courses.length === 0) return null;

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="pr-eyebrow">{t.recommendedTitle}</p>
        </div>
        <Link href="/courses" className="text-[12px] font-[800] text-[var(--brand)] hover:underline underline-offset-2">
          {t.browseCourses} →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => {
          const title = localize(locale, course.titleEn, course.titlePs, course.titleDa);
          const level = localizeLevel(course.level, locale);
          const bg = cardGradient(course.titleEn, course.id);

          return (
            <article
              key={course.id}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.25)] hover:shadow-[var(--shadow)]"
            >
              <div className="h-16 w-full shrink-0" style={{ background: bg }} />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex flex-wrap gap-1">
                  {level ? (
                    <span className="pr-badge">{level}</span>
                  ) : null}
                  {course.hasCertificate ? (
                    <span className="pr-badge pr-badge-cert">{t.certificateIncluded}</span>
                  ) : null}
                </div>
                <h3 className="text-[13px] font-[800] leading-snug tracking-[-0.2px] text-[var(--ink)] line-clamp-2">
                  {title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-[600] text-[var(--muted)]">
                  <span>{course.enrollmentCount} {t.enrolledStudents}</span>
                  {course.rating !== null ? <StarRating value={course.rating} /> : null}
                </div>
                <Link
                  href={`/courses/${encodeURIComponent(course.id)}`}
                  className="mt-auto inline-flex min-h-8 items-center justify-center rounded-[var(--radius)] bg-[var(--brand)] px-3 text-[12px] font-[900] text-white transition hover:bg-[var(--brand-hover)]"
                >
                  {t.startCourse}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
