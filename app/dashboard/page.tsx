import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MyCoursesView } from "@/components/MyCoursesView";
import { getCourseProgress } from "@/lib/security";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const locale = await getServerLocale();

  type EnrollmentRow = {
    createdAt: Date;
    course: {
      id: string;
      titleEn?: string; titlePs?: string; titleDa?: string | null;
      descriptionEn?: string; descriptionPs?: string; descriptionDa?: string | null;
      level?: string | null;
      modules: Array<{
        id: string;
        titleEn?: string; titlePs?: string;
        order: number;
        lessons: Array<{ id: string; isFinalTest: boolean }>;
      }>;
    };
  };

  let enrollments: EnrollmentRow[] = [];
  let dbError = false;

  try {
    enrollments = await db.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        course: {
          select: {
            id: true,
            ...localizedCourseSelect(locale),
            modules: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                ...localizedModuleSelect(locale),
                order: true,
                lessons: {
                  orderBy: { order: "asc" },
                  select: { id: true, isFinalTest: true, ...localizedLessonSelect(locale) }
                }
              }
            }
          }
        }
      }
    });
  } catch {
    dbError = true;
  }

  const progressByCourse = new Map<string, { completed: number; required: number; percent: number }>();

  if (!dbError && enrollments.length > 0) {
    try {
      const courseIds = enrollments.map((e) => e.course.id);
      const rows = await Promise.all(courseIds.map(async (courseId) => ({
        courseId,
        progress: await getCourseProgress(userId, courseId)
      })));
      for (const row of rows) {
        progressByCourse.set(row.courseId, row.progress);
      }
    } catch {
      // progress unavailable — show enrollments without progress
    }
  }

  const coursesWithProgress = enrollments.map((e) => {
    const course = e.course;
    const progress = progressByCourse.get(course.id);
    const totalModules = progress?.required ?? 0;
    const completedModules = progress?.completed ?? 0;
    const resumeIdx = completedModules < totalModules ? completedModules : totalModules - 1;
    const resumeLessonId = course.modules[resumeIdx]?.lessons[0]?.id ?? null;
    return {
      id: course.id,
      titleEn: course.titleEn ?? course.titlePs ?? "",
      titlePs: course.titlePs ?? course.titleEn ?? "",
      titleDa: course.titleDa,
      descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
      descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
      descriptionDa: course.descriptionDa,
      level: course.level,
      modules: course.modules.map((module) => ({
        id: module.id,
        titleEn: module.titleEn ?? module.titlePs ?? "",
        titlePs: module.titlePs ?? module.titleEn ?? "",
        order: module.order,
        lessons: module.lessons
      })),
      enrolledAt: e.createdAt,
      completedModules,
      totalModules,
      resumeLessonId
    };
  });

  return (
    <MyCoursesView
      courses={coursesWithProgress}
      userName={session.user.name ?? null}
      dbError={dbError}
    />
  );
}
