import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CourseStatus, LessonType, ProgressStatus } from "@prisma/client";
import { auth } from "@/auth";
import { CourseOverview } from "@/components/CourseOverview";
import { db } from "@/lib/db";
import { getCourseCertificateStatus } from "@/lib/actions/certificate-actions";
import { getEnrollmentStatus } from "@/lib/actions/enrollment-actions";
import { getCourseProgress } from "@/lib/security";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";
import { confirmPaidCourseCheckout, ensureEnrollmentForPaidCoursePayment } from "@/lib/stripe-course-payments";

const BASE_URL = "https://kabullearn.com";

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId: rawCourseId } = await params;
  const courseId = decodeURIComponent(rawCourseId);
  try {
    const c = await db.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: {
        id: true, slug: true, level: true,
        titleEn: true, titlePs: true, titleDa: true,
        descriptionEn: true, descriptionPs: true, descriptionDa: true,
        instructors: { orderBy: { order: "asc" }, take: 1, select: { profile: { select: { name: true } } } },
        authorProfile: { select: { name: true } },
      }
    });
    if (!c) return {};
    const title = c.titleEn || c.titlePs || c.titleDa || "Course";
    const description = (c.descriptionEn || c.descriptionPs || c.descriptionDa || "").slice(0, 160);
    const instructorName = c.instructors[0]?.profile?.name ?? c.authorProfile?.name ?? "";
    const url = `${BASE_URL}/courses/${encodeURIComponent(c.slug)}`;
    const ogParams = new URLSearchParams({
      title,
      ...(c.level ? { level: c.level } : {}),
      ...(instructorName ? { instructor: instructorName } : {}),
      id: c.id,
    });
    const ogImage = `${BASE_URL}/api/og/course/${encodeURIComponent(c.slug)}?${ogParams}`;
    return {
      title: `${title} — KabulLearn`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${title} — KabulLearn`,
        description,
        type: "website",
        url,
        siteName: "KabulLearn",
        images: [{ url: ogImage, width: 1200, height: 630, alt: `${title} — KabulLearn` }],
      },
      twitter: { card: "summary_large_image", title: `${title} — KabulLearn`, description, images: [ogImage] }
    };
  } catch {
    return {};
  }
}

export default async function CoursePage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const { courseId: rawCourseId } = await params;
  const resolvedSearchParams = await searchParams;
  const courseId = decodeURIComponent(rawCourseId);
  const locale = await getServerLocale();

  type InstructorProfile = {
    name: string;
    username: string;
    avatarUrl: string | null;
    professionalTitle: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    youtubeUrl: string | null;
    userId: string | null;
  };

  let course: {
    id: string;
    slug: string;
    titleEn?: string; titlePs?: string; titleDa?: string | null;
    descriptionEn?: string; descriptionPs?: string; descriptionDa?: string | null;
    level?: string | null;
    isPaid: boolean;
    priceCents: number | null;
    currency: string;
    status: CourseStatus;
    publishedAt: Date | null;
    author: { id: string; name: string | null; email: string };
    authorProfile: InstructorProfile | null;
    instructors: Array<{ profile: InstructorProfile }>;
    modules: Array<{
      id: string;
      titleEn?: string; titlePs?: string; titleDa?: string | null;
      order: number;
      lessons: Array<{ id: string; order: number; type: LessonType; titleEn?: string; titlePs?: string; titleDa?: string | null }>;
    }>;
  } | null = null;

  try {
    course = await db.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: {
        id: true,
        slug: true,
        ...localizedCourseSelect(locale),
        isPaid: true,
        priceCents: true,
        currency: true,
        status: true,
        publishedAt: true,
        author: { select: { id: true, name: true, email: true } },
        authorProfile: {
          select: {
            name: true,
            username: true,
            avatarUrl: true,
            professionalTitle: true,
            bio: true,
            linkedinUrl: true,
            youtubeUrl: true,
            userId: true
          }
        },
        instructors: {
          orderBy: { order: "asc" },
          select: {
            profile: {
              select: {
                name: true,
                username: true,
                avatarUrl: true,
                professionalTitle: true,
                bio: true,
                linkedinUrl: true,
                youtubeUrl: true,
                userId: true
              }
            }
          }
        },
        modules: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            ...localizedModuleSelect(locale),
            order: true,
            lessons: {
              orderBy: [{ order: "asc" }],
              select: { id: true, order: true, type: true, ...localizedLessonSelect(locale) }
            }
          }
        }
      }
    });
  } catch {
    // DB unreachable — error.tsx will handle the display
    throw new Error("Database temporarily unavailable. Please try again.");
  }

  // Accessible if currently published OR was previously published (editing/re-review in progress)
  if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
    return notFound();
  }
  const resolvedCourseId = course.id;
  const publicCourseRef = course.slug || course.id;

  const session = await auth();
  const userId = session?.user?.id;

  if (userId && resolvedSearchParams?.checkout === "success" && resolvedSearchParams.session_id) {
    await confirmPaidCourseCheckout({
      sessionId: resolvedSearchParams.session_id,
      userId,
      courseId: resolvedCourseId
    }).catch(() => false);
  } else if (userId) {
    await ensureEnrollmentForPaidCoursePayment({
      userId,
      courseId: resolvedCourseId
    }).catch(() => false);
  }

  let serverPassedModuleIds: string[] = [];
  let lessonStatuses: Record<string, "IN_PROGRESS" | "COMPLETED"> = {};
  let certificateStatus = null;
  let isEnrolled = false;
  let userRating: { rating: number; comment: string | null } | null = null;
  let ratingSummary: { average: number; count: number } | undefined;
  let progressPercent = 0;
  let announcements: Array<{ id: string; body: string; createdAt: Date }> = [];
  let reviews: Array<{ id: string; rating: number; comment: string | null; user: { name: string | null; email: string } }> = [];
  let discussionThreads: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    author: { name: string | null; email: string };
    replies: Array<{
      id: string;
      body: string;
      createdAt: Date;
      author: { name: string | null; email: string };
    }>;
  }> = [];

  try {
    const [ratingAggregate, ratingRows, threads] = await Promise.all([
      db.courseRating.aggregate({
        where: { courseId: resolvedCourseId },
        _avg: { rating: true },
        _count: { rating: true }
      }),
      db.courseRating.findMany({
        where: { courseId: resolvedCourseId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          rating: true,
          comment: true,
          user: { select: { name: true, email: true } }
        }
      }),
      db.discussionThread.findMany({
        where: { courseId: resolvedCourseId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          author: { select: { name: true, email: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            take: 5,
            select: {
              id: true,
              body: true,
              createdAt: true,
              author: { select: { name: true, email: true } }
            }
          }
        }
      })
    ]);
    discussionThreads = threads;
    reviews = ratingRows;
    if (ratingAggregate._count.rating > 0) {
      ratingSummary = {
        average: ratingAggregate._avg.rating ?? 0,
        count: ratingAggregate._count.rating
      };
    }
  } catch {
    // ratings unavailable
  }

  if (userId) {
    try {
      const [progressRows, certStatus, enrollStatus, ratingRow, progress] = await Promise.all([
        db.userProgress.findMany({
          where: { userId, lesson: { module: { courseId: resolvedCourseId } } },
          select: { lessonId: true, status: true, lesson: { select: { moduleId: true, type: true } } }
        }),
        getCourseCertificateStatus(resolvedCourseId, userId),
        getEnrollmentStatus(resolvedCourseId),
        db.courseRating.findUnique({
          where: {
            userId_courseId: { userId, courseId: resolvedCourseId }
          },
          select: { rating: true, comment: true }
        }),
        getCourseProgress(userId, resolvedCourseId)
      ]);
      serverPassedModuleIds = Array.from(new Set(
        progressRows
          .filter((p) => p.status === ProgressStatus.COMPLETED && p.lesson.type === "QUIZ")
          .map((p) => p.lesson.moduleId)
      ));
      for (const p of progressRows) {
        if (p.status === ProgressStatus.COMPLETED || p.status === ProgressStatus.IN_PROGRESS) {
          lessonStatuses[p.lessonId] = p.status;
        }
      }
      certificateStatus = certStatus;
      isEnrolled = enrollStatus;
      userRating = ratingRow;
      progressPercent = progress.percent;
      if (enrollStatus) {
        announcements = await db.courseAnnouncement.findMany({
          where: { courseId: resolvedCourseId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, body: true, createdAt: true }
        });
      }
    } catch {
      // Progress/enrollment unavailable — render without personalization
    }
  }

  // Students also enrolled in — find courses that share the most enrolled users
  type RelatedCourse = { id: string; titleEn: string; titlePs: string; titleDa?: string | null; level?: string | null; enrollmentCount: number };
  let relatedCourses: RelatedCourse[] = [];
  try {
    const courseEnrollments = await db.enrollment.findMany({
      where: { courseId: resolvedCourseId },
      select: { userId: true },
      take: 300
    });
    const enrolledUserIds = courseEnrollments.map((e) => e.userId);
    if (enrolledUserIds.length > 0) {
      const otherEnrollments = await db.enrollment.findMany({
        where: { userId: { in: enrolledUserIds }, courseId: { not: resolvedCourseId } },
        select: { courseId: true }
      });
      const counts: Record<string, number> = {};
      for (const e of otherEnrollments) {
        counts[e.courseId] = (counts[e.courseId] ?? 0) + 1;
      }
      const topIds = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([id]) => id);
      if (topIds.length > 0) {
        const docs = await db.course.findMany({
          where: { id: { in: topIds }, status: CourseStatus.PUBLISHED },
          select: { id: true, titleEn: true, titlePs: true, titleDa: true, level: true, _count: { select: { enrollments: true } } }
        });
        relatedCourses = topIds
          .map((id) => docs.find((c) => c.id === id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
          .map((c) => ({ id: c.id, titleEn: c.titleEn, titlePs: c.titlePs, titleDa: c.titleDa, level: c.level, enrollmentCount: c._count.enrollments }));
      }
    }
  } catch {
    // related courses unavailable
  }

  const instructorList =
    course.instructors.length > 0
      ? course.instructors.map((i) => i.profile)
      : course.authorProfile
        ? [course.authorProfile]
        : [];

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.titleEn || course.titlePs || "",
    description: (course.descriptionEn || course.descriptionPs || "").slice(0, 500),
    url: `${BASE_URL}/courses/${encodeURIComponent(publicCourseRef)}`,
    provider: { "@type": "Organization", name: "KabulLearn", url: BASE_URL },
    instructor: instructorList.map((p) => ({ "@type": "Person", name: p.name, url: `${BASE_URL}/creators/${encodeURIComponent(p.username)}` })),
    inLanguage: ["en", "ps", "fa"],
    isAccessibleForFree: !course.isPaid,
    educationalLevel: course.level ?? "Beginner",
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", inLanguage: ["en", "ps", "fa"] },
    offers: {
      "@type": "Offer",
      price: course.isPaid ? String((course.priceCents ?? 0) / 100) : "0",
      priceCurrency: (course.currency || "usd").toUpperCase(),
      category: course.isPaid ? "Paid" : "Free"
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Courses", item: `${BASE_URL}/courses` },
      { "@type": "ListItem", position: 3, name: course.titleEn || course.titlePs || "Course", item: `${BASE_URL}/courses/${encodeURIComponent(publicCourseRef)}` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CourseOverview
      course={{
        id: course.id,
        titleEn: course.titleEn ?? course.titlePs ?? "",
        titlePs: course.titlePs ?? course.titleEn ?? "",
        titleDa: course.titleDa,
        descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
        descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
        descriptionDa: course.descriptionDa,
        level: course.level ?? null,
        isPaid: course.isPaid,
        priceCents: course.priceCents,
        currency: course.currency,
        modules: course.modules.map((module) => ({
          id: module.id,
          titleEn: module.titleEn ?? module.titlePs ?? "",
          titlePs: module.titlePs ?? module.titleEn ?? "",
          titleDa: module.titleDa,
          order: module.order,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            order: lesson.order,
            type: lesson.type,
            titleEn: lesson.titleEn ?? lesson.titlePs ?? "",
            titlePs: lesson.titlePs ?? lesson.titleEn ?? "",
            titleDa: lesson.titleDa
          }))
        })),
        author: course.authorProfile
          ? course.authorProfile
          : {
              name: course.author.name ?? course.author.email,
              username: course.author.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
              avatarUrl: null,
              professionalTitle: null,
              bio: null,
              linkedinUrl: null,
              youtubeUrl: null,
              userId: null
            },
        instructors: course.instructors.map((i) => i.profile)
      }}
      serverPassedModuleIds={serverPassedModuleIds}
      certificateStatus={certificateStatus ?? undefined}
      isEnrolled={isEnrolled}
      userRating={userRating}
      ratingSummary={ratingSummary}
      reviews={reviews}
      progressPercent={progressPercent}
      discussionThreads={discussionThreads}
      instructorUserId={course.author.id}
      viewerId={userId ?? null}
      viewerRole={session?.user?.role ?? null}
      studentName={session?.user?.name ?? session?.user?.email ?? ""}
      lessonStatuses={lessonStatuses}
      relatedCourses={relatedCourses}
      announcements={announcements}
    />
    </>
  );
}
