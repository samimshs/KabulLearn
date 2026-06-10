import { notFound } from "next/navigation";
import { CourseStatus, LessonType, ProgressStatus } from "@prisma/client";
import { auth } from "@/auth";
import { CourseOverview } from "@/components/CourseOverview";
import { db } from "@/lib/db";
import { getCourseCertificateStatus } from "@/lib/actions/certificate-actions";
import { getEnrollmentStatus } from "@/lib/actions/enrollment-actions";
import { getCourseProgress } from "@/lib/security";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId: rawCourseId } = await params;
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
    titleEn?: string; titlePs?: string; titleDa?: string | null;
    descriptionEn?: string; descriptionPs?: string; descriptionDa?: string | null;
    level?: string | null;
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
    course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        ...localizedCourseSelect(locale),
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

  const session = await auth();
  const userId = session?.user?.id;

  let serverPassedModuleIds: string[] = [];
  let lessonStatuses: Record<string, "IN_PROGRESS" | "COMPLETED"> = {};
  let certificateStatus = null;
  let isEnrolled = false;
  let userRating: { rating: number; comment: string | null } | null = null;
  let ratingSummary: { average: number; count: number } | undefined;
  let progressPercent = 0;
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
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true }
      }),
      db.courseRating.findMany({
        where: { courseId },
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
        where: { courseId },
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
          where: { userId, lesson: { module: { courseId } } },
          select: { lessonId: true, status: true, lesson: { select: { moduleId: true, type: true } } }
        }),
        getCourseCertificateStatus(courseId, userId),
        getEnrollmentStatus(courseId),
        db.courseRating.findUnique({
          where: {
            userId_courseId: { userId, courseId }
          },
          select: { rating: true, comment: true }
        }),
        getCourseProgress(userId, courseId)
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
    } catch {
      // Progress/enrollment unavailable — render without personalization
    }
  }

  return (
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
    />
  );
}
