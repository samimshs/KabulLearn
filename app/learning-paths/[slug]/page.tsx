import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { dictionaries, localize, localizeLevel } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

const BASE_URL = "https://kabullearn.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = await db.learningPath.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { slug: true, titleEn: true, titlePs: true, titleDa: true, descriptionEn: true, descriptionPs: true, descriptionDa: true }
  }).catch(() => null);

  if (!path) return {};
  const title = path.titleEn || path.titlePs || path.titleDa || "Learning Path";
  const description = (path.descriptionEn || path.descriptionPs || path.descriptionDa || "").slice(0, 160);
  const url = `${BASE_URL}/learning-paths/${encodeURIComponent(path.slug)}`;

  return {
    title: `${title} — KabulLearn`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} — KabulLearn`, description, url, type: "website", siteName: "KabulLearn" },
    twitter: { card: "summary", title: `${title} — KabulLearn`, description }
  };
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const t = dictionaries[locale];

  const path = await db.learningPath.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: {
      slug: true,
      titleEn: true, titlePs: true, titleDa: true,
      descriptionEn: true, descriptionPs: true, descriptionDa: true,
      coverColor: true,
      courses: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          course: {
            select: {
              id: true,
              slug: true,
              titleEn: true, titlePs: true, titleDa: true,
              descriptionEn: true, descriptionPs: true, descriptionDa: true,
              level: true,
              _count: { select: { enrollments: true } },
              modules: { select: { lessons: { select: { id: true } } } }
            }
          }
        }
      }
    }
  }).catch(() => null);

  if (!path) notFound();

  const title = localize(locale, path.titleEn, path.titlePs, path.titleDa ?? undefined);
  const description = localize(locale, path.descriptionEn, path.descriptionPs, path.descriptionDa ?? undefined);

  return (
    <main className="pr-page grid gap-8 py-8">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="h-28" style={{ backgroundColor: path.coverColor }} />
        <div className="grid gap-3 p-6 lg:p-8">
          <Link href="/learning-paths" className="text-[12px] font-[800] text-[var(--brand)] underline-offset-2 hover:underline">
            {t.learningPathsTitle}
          </Link>
          <h1 className="pr-h1">{title}</h1>
          <p className="pr-copy max-w-3xl">{description}</p>
          <p className="text-[12px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
            {path.courses.length} {path.courses.length === 1 ? "course" : "courses"}
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        {path.courses.map(({ order, course }) => {
          const courseTitle = localize(locale, course.titleEn, course.titlePs, course.titleDa ?? undefined);
          const courseDesc = localize(locale, course.descriptionEn, course.descriptionPs, course.descriptionDa ?? undefined);
          const lessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
          const level = localizeLevel(course.level, locale);
          return (
            <article key={course.id} className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] md:grid-cols-[auto_1fr_auto] md:items-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--brand-50)] text-[15px] font-[900] text-[var(--brand)]">
                {order + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-[900] text-[var(--ink)]">{courseTitle}</h2>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">{courseDesc}</p>
                <p className="mt-2 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted-2)]">
                  {level ? `${level} · ` : ""}{lessons} {t.lessons} · {course._count.enrollments} {t.enrolledStudents}
                </p>
              </div>
              <Link href={`/courses/${encodeURIComponent(course.slug)}`} className="pr-btn-primary justify-center text-center">
                {t.viewCourse}
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
