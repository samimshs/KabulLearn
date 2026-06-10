import { redirect } from "next/navigation";
import { ProgressStatus, CourseStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardView } from "@/components/DashboardView";
import { getCourseProgress } from "@/lib/security";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";
import { getRecommendedCourses } from "@/lib/recommendations";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "EDUCATOR") redirect("/educator");

  const userId = session.user.id;
  const locale = await getServerLocale();

  let dbError = false;
  let enrollments: Awaited<ReturnType<typeof fetchEnrollments>> = [];
  let certificates: Awaited<ReturnType<typeof fetchCertificates>> = [];
  let userProfile = {
    name: session.user.name ?? session.user.email ?? "Learner",
    email: session.user.email ?? "",
    bio: "",
    image: session.user.image ?? null,
    linkedinUrl: null as string | null
  };
  let sessions: Array<{ id: string; label: string; expires: string; current?: boolean }> = [
    {
      id: "current-jwt",
      label: "Current browser session",
      expires: "managed by secure sign-in cookie",
      current: true
    }
  ];
  let completedLessonCount = 0;
  let quizAttemptCount = 0;

  async function fetchEnrollments() {
    return db.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        course: {
          select: {
            id: true,
            ...localizedCourseSelect(locale),
            instructors: {
              orderBy: { order: "asc" },
              select: { profile: { select: { name: true, username: true, avatarUrl: true } } }
            },
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
  }

  async function fetchCertificates() {
    return db.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        grade: true,
        issuedAt: true,
        verificationCode: true,
        course: { select: { id: true, ...localizedCourseSelect(locale) } }
      }
    });
  }

  try {
    const [profile, dbSessions, enrollmentRows, certificateRows, lessonCount, quizCount] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, bio: true, image: true }
      }),
      db.session.findMany({
        where: { userId },
        orderBy: { expires: "desc" },
        take: 8,
        select: { id: true, expires: true }
      }).catch(() => []),
      fetchEnrollments(),
      fetchCertificates(),
      db.userProgress.count({ where: { userId, status: ProgressStatus.COMPLETED } }),
      db.quizSubmission.count({ where: { userId } })
    ]);
    if (profile) {
      userProfile = {
        name: profile.name ?? session.user.email ?? "Learner",
        email: profile.email,
        bio: profile.bio ?? "",
        image: profile.image ?? null,
        linkedinUrl: null
      };
    }
    enrollments = enrollmentRows;
    certificates = certificateRows;
    completedLessonCount = lessonCount;
    quizAttemptCount = quizCount;
    sessions = [
      sessions[0],
      ...dbSessions.map((row, index) => ({
        id: row.id,
        label: `Stored session ${index + 1}`,
        expires: row.expires.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      }))
    ];
  } catch {
    dbError = true;
  }

  // Per-course module progress (consistent with the rest of the app)
  const progressByCourse = new Map<string, { completed: number; required: number; percent: number }>();
  if (!dbError && enrollments.length > 0) {
    try {
      const rows = await Promise.all(
        enrollments.map(async (e) => ({ id: e.course.id, progress: await getCourseProgress(userId, e.course.id) }))
      );
      for (const row of rows) progressByCourse.set(row.id, row.progress);
    } catch {
      /* progress unavailable — render without personalization */
    }
  }

  const enrolledIds = enrollments.map((e) => e.course.id);
  const enrolledLevels = enrollments.map((e) => e.course.level).filter(Boolean) as string[];

  // Recommended: published courses ranked by level affinity, popularity, rating
  let recommended: Awaited<ReturnType<typeof getRecommendedCourses>> = [];
  if (!dbError) {
    try {
      recommended = await getRecommendedCourses(enrolledIds, enrolledLevels, 4);
    } catch {
      /* recommended unavailable */
    }
  }

  // Shape enrolled courses for the dashboard cards
  const courses = enrollments.map((e, idx) => {
    const course = e.course;
    const progress = progressByCourse.get(course.id);
    const totalModules = progress?.required ?? course.modules.length;
    const completedModules = progress?.completed ?? 0;
    const percent = progress?.percent ?? 0;
    const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    const resumeIdx = completedModules < course.modules.length ? completedModules : course.modules.length - 1;
    const resumeLessonId = course.modules[resumeIdx]?.lessons[0]?.id ?? course.modules[0]?.lessons[0]?.id ?? null;
    const nextModuleTitle = course.modules[resumeIdx]?.titleEn ?? course.modules[resumeIdx]?.titlePs ?? "";
    return {
      id: course.id,
      titleEn: course.titleEn ?? course.titlePs ?? "",
      titlePs: course.titlePs ?? course.titleEn ?? "",
      titleDa: course.titleDa,
      descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
      descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
      descriptionDa: course.descriptionDa,
      level: course.level,
      hasCertificate: course.modules.length > 0 && course.modules.every((m) => m.lessons.some((l) => l.isFinalTest)),
      totalModules,
      completedModules,
      totalLessons,
      percent,
      resumeLessonId,
      nextModuleTitle,
      thumbIndex: idx,
      instructors: course.instructors.map((ci) => ci.profile),
      enrolledAt: e.createdAt
    };
  });

  // Aggregate stats
  const inProgress = courses.filter((c) => c.percent < 100).length;
  const coursesCompleted = courses.filter((c) => c.percent >= 100).length;
  const totalLessonsAll = courses.reduce((n, c) => n + c.totalLessons, 0);
  const overallPercent =
    courses.length > 0 ? Math.round(courses.reduce((n, c) => n + c.percent, 0) / courses.length) : 0;

  return (
    <DashboardView
      userName={session.user.name ?? null}
      userProfile={userProfile}
      sessions={sessions}
      dbError={dbError}
      stats={{
        inProgress,
        lessonsDone: completedLessonCount,
        certificates: certificates.length,
        quizAttempts: quizAttemptCount
      }}
      overall={{
        percent: overallPercent,
        lessonsCompleted: completedLessonCount,
        totalLessons: totalLessonsAll,
        coursesCompleted,
        coursesEnrolled: courses.length
      }}
      courses={courses}
      recommended={recommended}
      certificates={certificates.map((cert) => ({
        id: cert.id,
        grade: cert.grade,
        issuedAt: cert.issuedAt,
        verificationCode: cert.verificationCode,
        courseId: cert.course.id,
        courseTitleEn: cert.course.titleEn ?? cert.course.titlePs ?? "",
        courseTitlePs: cert.course.titlePs ?? cert.course.titleEn ?? "",
        courseTitleDa: cert.course.titleDa ?? null
      }))}
    />
  );
}
