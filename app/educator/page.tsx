import { redirect } from "next/navigation";
import { CourseStatus, ProgressStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreatorDashboardView } from "@/components/CreatorDashboardView";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";

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

  const [courses, profile, unreadMessages, dbSessions] = await Promise.all([
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
      sessions={[
        {
          id: "current-jwt",
          label: "Current browser session",
          expires: "managed by secure sign-in cookie",
          current: true
        },
        ...dbSessions.map((row, index) => ({
          id: row.id,
          label: `Stored session ${index + 1}`,
          expires: row.expires.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        }))
      ]}
    />
  );
}
