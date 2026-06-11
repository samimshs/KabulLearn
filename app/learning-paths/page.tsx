import Link from "next/link";
import { db } from "@/lib/db";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries, localize } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Paths — KabulLearn"
};

export default async function LearningPathsPage() {
  const locale = await getServerLocale();
  const t = dictionaries[locale];

  let paths: Array<{
    id: string; slug: string;
    titleEn: string; titlePs: string; titleDa?: string | null;
    descriptionEn: string; descriptionPs: string; descriptionDa?: string | null;
    coverColor: string;
    courses: Array<{
      order: number;
      course: { id: string; slug: string; titleEn: string; titlePs: string; titleDa?: string | null; level: string | null };
    }>;
  }> = [];

  try {
    paths = await db.learningPath.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true, slug: true,
        titleEn: true, titlePs: true, titleDa: true,
        descriptionEn: true, descriptionPs: true, descriptionDa: true,
        coverColor: true,
        courses: {
          orderBy: { order: "asc" },
          select: {
            order: true,
            course: {
              select: { id: true, slug: true, titleEn: true, titlePs: true, titleDa: true, level: true }
            }
          }
        }
      }
    });
  } catch {
    // DB unavailable — show empty state
  }

  return (
    <main className="pr-page grid gap-8">
      <header className="max-w-2xl">
        <h1 className="pr-h1">{t.learningPathsTitle}</h1>
        <p className="pr-copy mt-2">{t.learningPathsDesc}</p>
      </header>

      {paths.length === 0 ? (
        <div className="pr-card flex min-h-[200px] items-center justify-center p-10 text-center">
          <p className="pr-copy text-[var(--muted)]">{t.noResults ?? "No learning paths yet."}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => {
            const title = localize(locale, path.titleEn, path.titlePs, path.titleDa ?? undefined);
            const desc = localize(locale, path.descriptionEn, path.descriptionPs, path.descriptionDa ?? undefined);

            return (
              <article
                key={path.id}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow)]"
              >
                {/* Color header */}
                <div
                  className="relative h-24 p-5"
                  style={{ backgroundColor: path.coverColor }}
                >
                  <span className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-[800] uppercase tracking-[1px] text-white">
                    {path.courses.length} {path.courses.length === 1 ? "course" : "courses"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="text-[17px] font-[800] leading-snug tracking-tight text-[var(--ink)]">{title}</h2>
                  <p className="flex-1 text-[13px] leading-relaxed text-[var(--muted)]">{desc}</p>

                  {/* Course list */}
                  <ol className="grid gap-1.5">
                    {path.courses.slice(0, 5).map(({ order, course }) => {
                      const courseTitle = localize(locale, course.titleEn, course.titlePs, course.titleDa ?? undefined);
                      return (
                        <li key={course.id} className="flex items-center gap-2 text-[12px] font-[700] text-[var(--ink-2)]">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[10px] font-[800] text-[var(--muted)]">
                            {order + 1}
                          </span>
                          <span className="truncate">{courseTitle}</span>
                        </li>
                      );
                    })}
                    {path.courses.length > 5 && (
                      <li className="text-[11px] font-[700] text-[var(--muted)] ps-7">
                        +{path.courses.length - 5} more
                      </li>
                    )}
                  </ol>

                  <Link
                    href={`/learning-paths/${encodeURIComponent(path.slug)}`}
                    className="pr-btn-primary mt-2 w-full justify-center text-center text-[13px]"
                  >
                    {t.learningPathEnroll}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
