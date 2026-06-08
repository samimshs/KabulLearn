import { notFound, redirect } from "next/navigation";
import { CourseStatus, LessonType, ProgressStatus } from "@prisma/client";
import { auth } from "@/auth";
import { LessonView } from "@/components/LessonView";
import { db } from "@/lib/db";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";

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
    course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        ...localizedCourseSelect(locale),
        status: true,
        publishedAt: true,
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

  if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
    return notFound();
  }

  const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
  if (!lesson) {
    return notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Unauthenticated → login
  if (!userId) {
    const dest = `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(dest)}`);
  }

  // Not enrolled → course overview to enroll
  let isEnrolled = false;
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });
    isEnrolled = Boolean(enrollment);
  } catch {
    // DB error on enrollment check — allow access rather than block
    isEnrolled = true;
  }

  if (!isEnrolled) {
    redirect(`/courses/${encodeURIComponent(courseId)}`);
  }

  let serverPassedModuleIds: string[] = [];
  let lessonStatuses: Record<string, "IN_PROGRESS" | "COMPLETED"> = {};
  try {
    const rows = await db.userProgress.findMany({
      where: { userId, lesson: { module: { courseId } } },
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

  // If the student passed a quiz in every module, the course is complete
  // and all content should remain freely accessible for review
  const totalModules = course.modules.length;
  const isComplete = totalModules > 0 && serverPassedModuleIds.length >= totalModules;

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

  return <LessonView course={normalizedCourse} lesson={normalizedLesson} serverPassedModuleIds={serverPassedModuleIds} lessonStatuses={lessonStatuses} isComplete={isComplete} />;
}
