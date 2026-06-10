import { redirect } from "next/navigation";
import { CourseStatus, ProgressStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreatorDashboardView } from "@/components/CreatorDashboardView";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";
import type { StudentJourney } from "@/components/CreatorDashboardView";
import { getRecommendedCourses } from "@/lib/recommendations";

export default async function EducatorDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = params?.view === "resources" ? "resources" : null;
  const callbackUrl = view ? "/educator?view=resources" : "/educator";
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (session.user.role === UserRole.ADMIN) redirect("/admin");
  if (session.user.role !== UserRole.EDUCATOR) redirect("/dashboard");

  const educator = session.user;
  const locale = await getServerLocale();
  const t = dictionaries[locale];

  const [courses, profile, unreadMessages, dbSessions, rawCerts, rawEnrollments, rawProgress] = await Promise.all([
    db.course.findMany({
      where: { authorId: educator.id },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        status: true,
        titleEn: true,
        titlePs: true,
        titleDa: true,
        descriptionEn: true,
        descriptionPs: true,
        descriptionDa: true,
        updatedAt: true,
        reviewNote: true,
        reviewEvents: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { type: true }
        },
        _count: { select: { modules: true, enrollments: true } },
        enrollments: {
          select: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    }),
    db.user.findUnique({
      where: { id: educator.id },
      select: {
        name: true, email: true, bio: true, image: true,
        creatorProfile: { select: { linkedinUrl: true } }
      }
    }),
    db.directMessage.count({ where: { recipientId: educator.id, readAt: null } }).catch(() => 0),
    db.session.findMany({
      where: { userId: educator.id },
      orderBy: { expires: "desc" },
      take: 8,
      select: { id: true, expires: true }
    }).catch(() => []),
    db.certificate.findMany({
      where: { userId: educator.id },
      orderBy: { issuedAt: "desc" },
      select: {
        uuid: true, grade: true, issuedAt: true,
        courseId: true,
        course: { select: { titleEn: true, titlePs: true, titleDa: true } }
      }
    }).catch(() => []),
    db.enrollment.findMany({
      where: { userId: educator.id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        course: {
          select: {
            id: true, slug: true,
            titleEn: true, titlePs: true, titleDa: true,
            modules: { select: { lessons: { select: { id: true } } } }
          }
        }
      }
    }).catch(() => []),
    db.userProgress.findMany({
      where: { userId: educator.id, status: ProgressStatus.COMPLETED },
      select: { lessonId: true }
    }).catch(() => [])
  ]);

  const courseIds = courses.map((course) => course.id);
  const [completedCertificates, ratingAggregate] = courseIds.length > 0
    ? await Promise.all([
        db.certificate.count({ where: { courseId: { in: courseIds } } }),
        db.courseRating.aggregate({
          where: { courseId: { in: courseIds } },
          _avg: { rating: true },
          _count: { rating: true }
        })
      ]).catch(() => [0, { _avg: { rating: null }, _count: { rating: 0 } }] as const)
    : [0, { _avg: { rating: null }, _count: { rating: 0 } }] as const;

  const completedLessonIds = new Set(rawProgress.map((p) => p.lessonId));
  const certCourseIds = new Set(rawCerts.map((c) => c.courseId));

  const studentJourney: StudentJourney = {
    certificates: rawCerts.map((c) => ({
      certificateUuid: c.uuid,
      courseId: c.courseId,
      courseTitle: c.course.titleEn ?? c.course.titlePs ?? c.course.titleDa ?? "Untitled",
      grade: Math.round(c.grade),
      issuedAt: c.issuedAt.toISOString()
    })),
    enrollments: rawEnrollments.map((e) => {
      const allLessons = e.course.modules.flatMap((m) => m.lessons);
      return {
        courseId: e.course.id,
        courseSlug: e.course.slug,
        courseTitle: e.course.titleEn ?? e.course.titlePs ?? e.course.titleDa ?? "Untitled",
        enrolledAt: e.createdAt.toISOString(),
        totalLessons: allLessons.length,
        completedLessons: allLessons.filter((l) => completedLessonIds.has(l.id)).length,
        hasCertificate: certCourseIds.has(e.course.id)
      };
    })
  };

  const totalEnrollments = courses.reduce((sum, course) => sum + course._count.enrollments, 0);
  const activeCourses = courses.filter((course) => course.status === CourseStatus.PUBLISHED).length;
  const completionRate = totalEnrollments > 0 ? Math.min(100, Math.round((completedCertificates / totalEnrollments) * 100)) : 0;

  const studentNames = Array.from(
    new Set(
      courses.flatMap((course) =>
        course.enrollments.map((enrollment) => enrollment.user.name ?? "Unnamed learner")
      )
    )
  ).sort((a, b) => a.localeCompare(b));

  const enrolledCourseIds = rawEnrollments.map((e) => e.course.id);
  const enrolledLevels: string[] = [];
  const recommendedCourses = await getRecommendedCourses(enrolledCourseIds, enrolledLevels, 4).catch(() => []);

  return (
    <CreatorDashboardView
      firstName={profile?.name?.split(/\s+/)[0] ?? educator.name?.split(/\s+/)[0] ?? "there"}
      intro={t.educatorIntro}
      courses={courses.map((course) => ({
        id: course.id,
        slug: course.slug,
        status: course.status,
        title: course.titleEn ?? course.titlePs ?? course.titleDa ?? "Untitled course",
        description: course.descriptionEn ?? course.descriptionPs ?? course.descriptionDa ?? "",
        modules: course._count.modules,
        enrollments: course._count.enrollments,
        updatedAt: course.updatedAt.toISOString(),
        reviewNote: course.reviewNote,
        latestReview: course.reviewEvents[0]?.type ?? null
      }))}
      students={studentNames}
      metrics={{
        enrollments: totalEnrollments,
        activeCourses,
        averageRating: ratingAggregate._avg.rating,
        ratingCount: ratingAggregate._count.rating,
        unreadMessages,
        completedCertificates,
        completionRate
      }}
      profile={{
        name: profile?.name ?? educator.name ?? "Creator",
        email: profile?.email ?? educator.email ?? "",
        bio: profile?.bio ?? "",
        image: profile?.image ?? educator.image ?? null,
        linkedinUrl: profile?.creatorProfile?.linkedinUrl ?? null
      }}
      studentJourney={studentJourney}
      recommendedCourses={recommendedCourses}
      sessions={[
        {
          id: "current-jwt",
          label: t.currentBrowserSession,
          expires: t.managedByCookie,
          current: true
        },
        ...dbSessions.map((row, index) => ({
          id: row.id,
          label: `${t.storedSession} ${index + 1}`,
          expires: row.expires.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        }))
      ]}
    />
  );
}
