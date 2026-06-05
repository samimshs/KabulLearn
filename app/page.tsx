import Link from "next/link";
import { CourseDashboard, EducatorCta } from "@/components/CourseDashboard";
import ValuePillars from "@/components/ValuePillars";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";
import { getCourseProgress } from "@/lib/security";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";

type CourseRow = {
  id: string;
  titleEn: string; titlePs: string; titleDa?: string | null;
  descriptionEn: string; descriptionPs: string; descriptionDa?: string | null;
  level?: string | null;
  enrollmentCount: number;
  isEnrolled: boolean;
  hasCertificate: boolean;
  modules: Array<{ id: string; titleEn: string; titlePs: string; order: number; lessons: Array<{ id: string; order: number }> }>;
  progress?: { completedModules: number; totalModules: number };
  rating?: { average: number; count: number };
  instructors?: Array<{ name: string; username: string; avatarUrl: string | null }>;
};

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const locale = await getServerLocale();
  const params = await searchParams;
  const searchTerm = params?.q?.trim();
  const dict = dictionaries[locale];

  let rawCourses: Array<{
    id: string; titleEn?: string; titlePs?: string; titleDa?: string | null;
    descriptionEn?: string; descriptionPs?: string; descriptionDa?: string | null;
    level?: string | null;
    _count: { enrollments: number };
    modules: Array<{ id: string; titleEn?: string; titlePs?: string; order: number; lessons: Array<{ id: string; order: number; isFinalTest: boolean }> }>;
    author: { name: string | null; email: string };
    authorProfile: { name: string; username: string; avatarUrl: string | null } | null;
    instructors: Array<{ order: number; profile: { name: string; username: string; avatarUrl: string | null } }>;
  }> = [];

  let dbError = false;

  try {
    rawCourses = await db.course.findMany({
      where: {
        AND: [
          {
            OR: [
              { status: CourseStatus.PUBLISHED },
              { publishedAt: { not: null } }
            ]
          },
          searchTerm
            ? {
                OR: [
                  { titleEn: { contains: searchTerm, mode: "insensitive" } },
                  { titlePs: { contains: searchTerm, mode: "insensitive" } },
                  { descriptionEn: { contains: searchTerm, mode: "insensitive" } },
                  { descriptionPs: { contains: searchTerm, mode: "insensitive" } },
                  { authorProfile: { is: { name: { contains: searchTerm, mode: "insensitive" } } } },
                  { authorProfile: { is: { username: { contains: searchTerm, mode: "insensitive" } } } },
                  { author: { is: { name: { contains: searchTerm, mode: "insensitive" } } } }
                ]
              }
            : {}
        ]
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        titleEn: true, titlePs: true, titleDa: true,
        descriptionEn: true, descriptionPs: true, descriptionDa: true,
        level: true,
        _count: { select: { enrollments: true } },
        author: { select: { name: true, email: true } },
        authorProfile: { select: { name: true, username: true, avatarUrl: true } },
        instructors: { orderBy: { order: "asc" }, select: { order: true, profile: { select: { name: true, username: true, avatarUrl: true } } } },
        modules: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            titleEn: true, titlePs: true,
            order: true,
            lessons: { orderBy: [{ order: "asc" }], select: { id: true, order: true, isFinalTest: true } }
          }
        }
      }
    });
  } catch {
    dbError = true;
  }

  const enrolledCourseIds = new Set<string>();
  const progressByCourse = new Map<string, { completedModules: number; totalModules: number }>();
  const ratingsByCourse = new Map<string, { average: number; count: number }>();

  if (rawCourses.length > 0) {
    try {
      const ratingRows = await db.courseRating.groupBy({
        by: ["courseId"],
        where: { courseId: { in: rawCourses.map((course) => course.id) } },
        _avg: { rating: true },
        _count: { rating: true }
      });
      for (const row of ratingRows) {
        ratingsByCourse.set(row.courseId, {
          average: row._avg.rating ?? 0,
          count: row._count.rating
        });
      }
    } catch {
      // ratings unavailable
    }
  }

  if (userId && rawCourses.length > 0) {
    try {
      const [enrollments, progressRows] = await Promise.all([
        db.enrollment.findMany({
          where: { userId, courseId: { in: rawCourses.map((c) => c.id) } },
          select: { courseId: true }
        }),
        Promise.all(rawCourses.map(async (course) => ({
          courseId: course.id,
          progress: await getCourseProgress(userId, course.id)
        })))
      ]);

      for (const e of enrollments) {
        enrolledCourseIds.add(e.courseId);
      }

      for (const row of progressRows) {
        progressByCourse.set(row.courseId, {
          completedModules: row.progress.completed,
          totalModules: row.progress.required
        });
      }
    } catch {
      // progress/enrollment unavailable — show courses without personalization
    }
  }

  const courses: CourseRow[] = rawCourses.map((c) => {
    const hasCertificate = c.modules.length > 0 &&
      c.modules.every(m => m.lessons.some(l => l.isFinalTest));
    return {
    id: c.id,
    titleEn: c.titleEn ?? c.titlePs ?? "",
    titlePs: c.titlePs ?? c.titleEn ?? "",
    titleDa: c.titleDa,
    descriptionEn: c.descriptionEn ?? c.descriptionPs ?? "",
    descriptionPs: c.descriptionPs ?? c.descriptionEn ?? "",
    descriptionDa: c.descriptionDa,
    level: c.level,
    hasCertificate,
    modules: c.modules.map((module) => ({
      id: module.id,
      titleEn: module.titleEn ?? module.titlePs ?? "",
      titlePs: module.titlePs ?? module.titleEn ?? "",
      order: module.order,
      lessons: module.lessons.map(l => ({ id: l.id, order: l.order }))
    })),
    enrollmentCount: c._count.enrollments,
    isEnrolled: enrolledCourseIds.has(c.id),
    rating: ratingsByCourse.get(c.id),
    instructors: c.instructors.length > 0
      ? c.instructors.sort((a, b) => a.order - b.order).map((ci) => ci.profile)
      : c.authorProfile
        ? [c.authorProfile]
        : [{ name: c.author.name ?? c.author.email, username: c.author.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), avatarUrl: null }],
    progress: userId
      ? progressByCourse.get(c.id) ?? { completedModules: 0, totalModules: 0 }
      : undefined
    };
  });

  const featureTokens = [
    dict.featureStructured,
    dict.featurePractice,
    dict.featureCerts,
    dict.featureLowBandwidth,
  ];

  return (
    <main className="pr-page">

      {/* ── Split-screen hero ───────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-10 lg:py-14">

        {/* Left: value proposition */}
        <div className="flex flex-col gap-6">
          <p className="pr-eyebrow">{dict.heroEyebrow}</p>
          <h1 className="pr-h1">{dict.heroHeading}</h1>
          <p className="pr-copy max-w-lg">{dict.heroSubtext}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/#courses" className="pr-btn-primary">
              {dict.heroCta}
            </Link>
            {!userId && (
              <Link href="/register" className="pr-btn-ghost">
                {dict.heroCtaSecondary}
              </Link>
            )}
          </div>
        </div>

        {/* Right: image asset */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-lg)]">
          <img
            src="/classroom-hero.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
          <span className="absolute bottom-6 start-6 h-1.5 w-16 rounded-full bg-[var(--brand)]" />
        </div>
      </section>

      {/* ── Course catalogue ────────────────────────────────────── */}
      <div id="courses">
        <CourseDashboard courses={courses} dbError={dbError} />
      </div>

      {/* ── Value pillars ───────────────────────────────────────── */}
      <ValuePillars dict={dict} />

      {/* ── Social proof strip ──────────────────────────────────── */}
      <div className="my-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {featureTokens.map((label) => (
          <div
            key={label}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-sm)]"
          >
            <p className="text-[13px] font-[800] leading-snug text-[var(--ink-2)]">{label}</p>
          </div>
        ))}
      </div>

      <EducatorCta />
    </main>
  );
}
