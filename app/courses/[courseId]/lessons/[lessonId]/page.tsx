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
  try {
    const rows = await db.userProgress.findMany({
      where: {
        userId,
        status: ProgressStatus.COMPLETED,
        lesson: { type: "QUIZ", module: { courseId } }
      },
      select: { lesson: { select: { moduleId: true } } }
    });
    serverPassedModuleIds = Array.from(new Set(rows.map((r) => r.lesson.moduleId)));
  } catch {
    // progress unavailable — gating falls back to localStorage
  }

  // If the student passed a quiz in every module, the course is complete
  // and all content should remain freely accessible for review
  const totalModules = course.modules.length;
  const isComplete = totalModules > 0 && serverPassedModuleIds.length >= totalModules;

  const normalizedCourse: CourseForLesson = {
    ...course,
    titleEn: course.titleEn ?? course.titlePs ?? "",
    titlePs: course.titlePs ?? course.titleEn ?? "",
    descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
    descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
    level: (course as unknown as { level?: string | null }).level ?? null,
    modules: course.modules.map((module) => ({
      ...module,
      titleEn: module.titleEn ?? module.titlePs ?? "",
      titlePs: module.titlePs ?? module.titleEn ?? "",
      lessons: module.lessons.map((item) => ({
        ...item,
        titleEn: item.titleEn ?? item.titlePs ?? "",
        titlePs: item.titlePs ?? item.titleEn ?? "",
        descriptionEn: item.descriptionEn ?? item.descriptionPs ?? null,
        descriptionPs: item.descriptionPs ?? item.descriptionEn ?? null,
        readingEn: item.readingEn ?? item.readingPs ?? null,
        readingPs: item.readingPs ?? item.readingEn ?? null
      }))
    }))
  };
  const normalizedLesson = normalizedCourse.modules.flatMap((module) => module.lessons).find((item) => item.id === lesson.id) ?? lesson;

  return <LessonView course={normalizedCourse} lesson={normalizedLesson} serverPassedModuleIds={serverPassedModuleIds} isComplete={isComplete} />;
}
