import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CourseStatus, LessonType, ProgressStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { LessonView } from "@/components/LessonView";
import { db } from "@/lib/db";
import { getLessonNote } from "@/lib/actions/note-actions";
import { getLessonBookmark } from "@/lib/actions/bookmark-actions";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";

const BASE_URL = "https://kabullearn.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<Metadata> {
  const { courseId: rawCourseId, lessonId: rawLessonId } = await params;
  const courseId = decodeURIComponent(rawCourseId);
  const lessonId = decodeURIComponent(rawLessonId);
  try {
    const course = await db.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: {
        id: true, slug: true, level: true,
        titleEn: true, titlePs: true,
        instructors: { orderBy: { order: "asc" }, take: 1, select: { profile: { select: { name: true } } } },
        authorProfile: { select: { name: true } },
        modules: {
          select: {
            lessons: {
              where: { id: lessonId },
              select: { titleEn: true, titlePs: true, descriptionEn: true, descriptionPs: true },
            },
          },
        },
      },
    });
    if (!course) return {};
    const lesson = course.modules.flatMap((m) => m.lessons).find(Boolean);
    const courseTitle = course.titleEn || course.titlePs || "Course";
    const lessonTitle = lesson?.titleEn || lesson?.titlePs || courseTitle;
    const description = (
      lesson?.descriptionEn || lesson?.descriptionPs || `Part of ${courseTitle} on KabulLearn`
    ).slice(0, 160);
    const instructorName = course.instructors[0]?.profile?.name ?? course.authorProfile?.name ?? "";
    const url = `${BASE_URL}/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lessonId)}`;
    const ogParams = new URLSearchParams({
      title: courseTitle,
      ...(course.level ? { level: course.level } : {}),
      ...(instructorName ? { instructor: instructorName } : {}),
      id: course.id,
    });
    const ogImage = `${BASE_URL}/api/og/course/${encodeURIComponent(course.slug)}?${ogParams}`;
    return {
      title: `${lessonTitle} — ${courseTitle} | KabulLearn`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${lessonTitle} — ${courseTitle} | KabulLearn`,
        description,
        type: "website",
        url,
        siteName: "KabulLearn",
        images: [{ url: ogImage, width: 1200, height: 630, alt: `${courseTitle} — KabulLearn` }],
      },
      twitter: { card: "summary_large_image", title: `${lessonTitle} — ${courseTitle} | KabulLearn`, description, images: [ogImage] },
    };
  } catch {
    return {};
  }
}

type LessonInPage = {
  id: string; moduleId: string; order: number; type: LessonType;
  titleEn: string; titlePs: string;
  descriptionEn: string | null; descriptionPs: string | null;
  youtubeUrl: string | null; readingEn: string | null; readingPs: string | null;
  isFinalTest: boolean; passingScore: number | null;
};

type CourseForLesson = {
  id: string; titleEn: string; titlePs: string;
  descriptionEn: string; descriptionPs: string;
  level: string | null;
  status: CourseStatus;
  publishedAt: Date | null;
  authorId: string;
  modules: Array<{
    id: string; titleEn: string; titlePs: string; order: number;
    lessons: LessonInPage[];
  }>;
};

export default async function LessonPage({
  params
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const rawParams = await params;
  const courseId = decodeURIComponent(rawParams.courseId);
  const lessonId = decodeURIComponent(rawParams.lessonId);
  const locale = await getServerLocale();

  let course: CourseForLesson | null = null;

  try {
    course = await db.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: {
        id: true,
        ...localizedCourseSelect(locale),
        status: true,
        publishedAt: true,
        authorId: true,
        modules: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            ...localizedModuleSelect(locale),
            order: true,
            lessons: {
              orderBy: [{ order: "asc" }],
              select: {
                id: true, moduleId: true, order: true, type: true,
                ...localizedLessonSelect(locale),
                youtubeUrl: true, readingEn: true, readingPs: true,
                isFinalTest: true, passingScore: true
              }
            }
          }
        }
      }
    }) as unknown as CourseForLesson | null;
  } catch {
    throw new Error("Database temporarily unavailable.");
  }

  if (!course) return notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isEducatorAuthor =
    session?.user?.role === UserRole.EDUCATOR && course.authorId === userId;

  if (!isAdmin && !isEducatorAuthor &&
      course.status !== CourseStatus.PUBLISHED &&
      !(course.status === CourseStatus.PENDING_REVIEW && course.publishedAt !== null)) {
    return notFound();
  }
  const resolvedCourseId = course.id;

  const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
  if (!lesson) {
    return notFound();
  }

  // Determine which lesson is the free preview (first non-quiz lesson of the first module)
  const firstModule = course.modules.reduce((a, b) => a.order <= b.order ? a : b);
  const previewLesson = firstModule.lessons
    .filter((l) => l.type !== "QUIZ")
    .reduce<typeof lesson | null>((best, l) => best === null || l.order < best.order ? l : best, null);
  const isThePreviewLesson = previewLesson?.id === lesson.id;

  // Unauthenticated: allow preview lesson, else redirect to login
  if (!userId) {
    if (!isThePreviewLesson) {
      const dest = `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
      redirect(`/login?callbackUrl=${encodeURIComponent(dest)}`);
    }
  }

  // Admins and educator-authors can view any lesson without enrollment
  let isEnrolled = false;
  if (isAdmin || isEducatorAuthor) {
    isEnrolled = true;
  } else if (userId) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: resolvedCourseId } }
    });
    isEnrolled = Boolean(enrollment);
  }

  // Only show the preview banner to unenrolled visitors
  const isPreviewLesson = isThePreviewLesson && !isEnrolled;

  if (!isEnrolled && !isPreviewLesson) {
    redirect(`/courses/${encodeURIComponent(courseId)}`);
  }

  let serverPassedModuleIds: string[] = [];
  let lessonStatuses: Record<string, "IN_PROGRESS" | "COMPLETED"> = {};
  if (userId) {
    try {
      const rows = await db.userProgress.findMany({
        where: { userId, lesson: { module: { courseId: resolvedCourseId } } },
        select: { lessonId: true, status: true, lesson: { select: { moduleId: true, type: true } } }
      });
      serverPassedModuleIds = Array.from(
        new Set(
          rows
            .filter((r) => r.status === ProgressStatus.COMPLETED && r.lesson.type === "QUIZ")
            .map((r) => r.lesson.moduleId)
        )
      );
      for (const r of rows) {
        if (r.status === ProgressStatus.COMPLETED || r.status === ProgressStatus.IN_PROGRESS) {
          lessonStatuses[r.lessonId] = r.status;
        }
      }
    } catch {
      // progress unavailable — gating falls back to localStorage
    }
  }

  // If the student passed a quiz in every module, the course is complete
  // and all content should remain freely accessible for review
  const totalModules = course.modules.length;
  const isComplete = isAdmin || isEducatorAuthor || (totalModules > 0 && serverPassedModuleIds.length >= totalModules);

  // The query selects English + the ACTIVE locale's field (titlePs for ps,
  // titleDa for fa). Fold that into the `…Ps` field the views read for any
  // non-English locale, so Dari content (titleDa/descriptionDa/readingDa) shows
  // instead of falling back to English.
  const localized = (row: unknown, base: string): string | null => {
    const r = row as Record<string, string | null | undefined>;
    if (locale === "fa") return r[`${base}Da`] ?? r[`${base}En`] ?? null;
    if (locale === "ps") return r[`${base}Ps`] ?? r[`${base}En`] ?? null;
    return r[`${base}En`] ?? null;
  };

  const normalizedCourse: CourseForLesson = {
    ...course,
    titleEn: course.titleEn ?? "",
    titlePs: localized(course, "title") ?? course.titleEn ?? "",
    descriptionEn: course.descriptionEn ?? "",
    descriptionPs: localized(course, "description") ?? course.descriptionEn ?? "",
    level: (course as unknown as { level?: string | null }).level ?? null,
    modules: course.modules.map((module) => ({
      ...module,
      titleEn: module.titleEn ?? "",
      titlePs: localized(module, "title") ?? module.titleEn ?? "",
      lessons: module.lessons.map((item) => ({
        ...item,
        titleEn: item.titleEn ?? "",
        titlePs: localized(item, "title") ?? item.titleEn ?? "",
        descriptionEn: item.descriptionEn ?? null,
        descriptionPs: localized(item, "description"),
        readingEn: item.readingEn ?? null,
        readingPs: localized(item, "reading")
      }))
    }))
  };
  const normalizedLesson = normalizedCourse.modules.flatMap((module) => module.lessons).find((item) => item.id === lesson.id) ?? lesson;

  const canUseNotes = Boolean(userId && (isEnrolled || isThePreviewLesson));

  const [initialNote, initialBookmarked] = canUseNotes
    ? await Promise.all([
        getLessonNote(lessonId).catch(() => ""),
        isEnrolled ? getLessonBookmark(lessonId).catch(() => false) : Promise.resolve(false)
      ])
    : ["", false] as const;

  return <LessonView course={normalizedCourse} lesson={normalizedLesson} serverPassedModuleIds={serverPassedModuleIds} lessonStatuses={lessonStatuses} isComplete={isComplete} isPreviewLesson={isPreviewLesson} canUseNotes={canUseNotes} initialNote={initialNote} initialBookmarked={initialBookmarked} />;
}
