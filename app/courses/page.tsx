import { CourseDashboard } from "@/components/CourseDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";
import { getCourseProgress } from "@/lib/security";

type CourseRow = {
  id: string;
  slug?: string;
  titleEn: string;
  titlePs: string;
  titleDa?: string | null;
  descriptionEn: string;
  descriptionPs: string;
  descriptionDa?: string | null;
  level?: string | null;
  enrollmentCount: number;
  isEnrolled: boolean;
  isCreatorCourse: boolean;
  hasCertificate: boolean;
  modules: Array<{ id: string; titleEn: string; titlePs: string; order: number; lessons: Array<{ id: string; order: number }> }>;
  progress?: { completedModules: number; totalModules: number };
  rating?: { average: number; count: number };
  instructors?: Array<{ name: string; username: string; avatarUrl: string | null }>;
};

export default async function CoursesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; tag?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const params = await searchParams;
  const searchTerm = params?.q?.trim();
  const activeTag = params?.tag?.trim();

  let rawCourses: Array<{
    id: string;
    slug: string;
    authorId: string;
    titleEn?: string; titlePs?: string; titleDa?: string | null;
    descriptionEn?: string; descriptionPs?: string; descriptionDa?: string | null;
    level?: string | null;
    _count: { enrollments: number };
    modules: Array<{ id: string; titleEn?: string; titlePs?: string; titleDa?: string | null; order: number; lessons: Array<{ id: string; order: number; isFinalTest: boolean }> }>;
    author: { name: string | null; email: string };
    authorProfile: { name: string; username: string; avatarUrl: string | null } | null;
    instructors: Array<{ order: number; profile: { name: string; username: string; avatarUrl: string | null; userId: string | null } }>;
    tags: Array<{ tag: { id: string; slug: string; label: string } }>;
  }> = [];
  let availableTags: Array<{ id: string; slug: string; label: string }> = [];

  let dbError = false;

  try {
    [rawCourses, availableTags] = await Promise.all([
      db.course.findMany({
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
                    { titleDa: { contains: searchTerm, mode: "insensitive" } },
                    { descriptionEn: { contains: searchTerm, mode: "insensitive" } },
                    { descriptionPs: { contains: searchTerm, mode: "insensitive" } },
                    { descriptionDa: { contains: searchTerm, mode: "insensitive" } },
                    { authorProfile: { is: { name: { contains: searchTerm, mode: "insensitive" } } } },
                    { authorProfile: { is: { username: { contains: searchTerm, mode: "insensitive" } } } },
                    { author: { is: { name: { contains: searchTerm, mode: "insensitive" } } } }
                  ]
                }
              : {},
            activeTag ? { tags: { some: { tag: { slug: activeTag } } } } : {}
          ]
        },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          authorId: true,
          titleEn: true, titlePs: true, titleDa: true,
          descriptionEn: true, descriptionPs: true, descriptionDa: true,
          level: true,
          _count: { select: { enrollments: true } },
          author: { select: { name: true, email: true } },
          authorProfile: { select: { name: true, username: true, avatarUrl: true } },
          instructors: { orderBy: { order: "asc" }, select: { order: true, profile: { select: { name: true, username: true, avatarUrl: true, userId: true } } } },
          modules: {
            orderBy: [{ order: "asc" }],
            select: {
              id: true,
              titleEn: true, titlePs: true, titleDa: true,
              order: true,
              lessons: { orderBy: [{ order: "asc" }], select: { id: true, order: true, isFinalTest: true } }
            }
          },
          tags: { select: { tag: { select: { id: true, slug: true, label: true } } } }
        }
      }),
      db.courseTag.findMany({ orderBy: { label: "asc" }, select: { id: true, slug: true, label: true } })
    ]);
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
          where: { userId, courseId: { in: rawCourses.map((course) => course.id) } },
          select: { courseId: true }
        }),
        Promise.all(rawCourses.map(async (course) => ({
          courseId: course.id,
          progress: await getCourseProgress(userId, course.id)
        })))
      ]);

      for (const enrollment of enrollments) {
        enrolledCourseIds.add(enrollment.courseId);
      }

      for (const row of progressRows) {
        progressByCourse.set(row.courseId, {
          completedModules: row.progress.completed,
          totalModules: row.progress.required
        });
      }
    } catch {
      // progress/enrollment unavailable
    }
  }

  const courses: CourseRow[] = rawCourses.map((course) => {
    const hasCertificate = course.modules.length > 0 &&
      course.modules.every((module) => module.lessons.some((lesson) => lesson.isFinalTest));

    return {
      id: course.id,
      slug: course.slug,
      titleEn: course.titleEn ?? course.titlePs ?? "",
      titlePs: course.titlePs ?? course.titleEn ?? "",
      titleDa: course.titleDa,
      descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
      descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
      descriptionDa: course.descriptionDa,
      level: course.level,
      hasCertificate,
      tagSlugs: course.tags?.map((t) => t.tag.slug) ?? [],
      modules: course.modules.map((module) => ({
        id: module.id,
        titleEn: module.titleEn ?? module.titlePs ?? "",
        titlePs: module.titlePs ?? module.titleEn ?? "",
        titleDa: module.titleDa,
        order: module.order,
        lessons: module.lessons.map((lesson) => ({ id: lesson.id, order: lesson.order }))
      })),
      enrollmentCount: course._count.enrollments,
      isEnrolled: enrolledCourseIds.has(course.id),
      isCreatorCourse: Boolean(userId && (
        course.authorId === userId ||
        course.instructors.some((courseInstructor) => courseInstructor.profile.userId === userId)
      )),
      rating: ratingsByCourse.get(course.id),
      instructors: course.instructors.length > 0
        ? course.instructors.sort((a, b) => a.order - b.order).map((courseInstructor) => ({
            name: courseInstructor.profile.name,
            username: courseInstructor.profile.username,
            avatarUrl: courseInstructor.profile.avatarUrl
          }))
        : course.authorProfile
          ? [course.authorProfile]
          : [{
              name: course.author.name ?? course.author.email,
              username: course.author.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
              avatarUrl: null
            }],
      progress: userId
        ? progressByCourse.get(course.id) ?? { completedModules: 0, totalModules: 0 }
        : undefined
    };
  });

  return (
    <main className="pr-page py-8">
      <CourseDashboard courses={courses} dbError={dbError} isAuthenticated={Boolean(userId)} availableTags={availableTags} activeTag={activeTag} />
    </main>
  );
}
