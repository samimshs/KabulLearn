import Link from "next/link";
import { UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CourseOverview } from "@/components/CourseOverview";
import { db } from "@/lib/db";
import { canManageCourse } from "@/lib/rbac";

export default async function EducatorCoursePreviewPage({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Feducator");
  if (session.user.role === UserRole.ADMIN) redirect("/admin");
  if (session.user.role !== UserRole.EDUCATOR) redirect("/dashboard");

  const { courseId } = await params;
  const course = await db.course.findUnique({
    where: { id: decodeURIComponent(courseId) },
    select: {
      id: true,
      titleEn: true,
      titlePs: true,
      titleDa: true,
      descriptionEn: true,
      descriptionPs: true,
      descriptionDa: true,
      level: true,
      isPaid: true,
      priceCents: true,
      currency: true,
      authorId: true,
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
        orderBy: { order: "asc" },
        select: {
          id: true,
          titleEn: true,
          titlePs: true,
          titleDa: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              type: true,
              titleEn: true,
              titlePs: true,
              titleDa: true
            }
          }
        }
      }
    }
  });

  if (!course || !canManageCourse({ requesterId: session.user.id, requesterRole: session.user.role, authorId: course.authorId })) {
    notFound();
  }

  const authorFallback = {
    name: course.author.name ?? course.author.email,
    username: course.author.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    avatarUrl: null,
    professionalTitle: null,
    bio: null,
    linkedinUrl: null,
    youtubeUrl: null,
    userId: course.author.id
  };

  return (
    <div className="grid gap-5">
      <section className="mx-auto mt-4 flex w-[min(1180px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[1.5px] text-[var(--brand)]">Student preview</p>
          <p className="mt-1 text-sm font-bold text-[var(--ink-2)]">
            This page uses the student course layout, while keeping enrollment and payment actions in preview mode.
          </p>
        </div>
        <Link href={`/educator/courses/${course.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-black text-[var(--brand)] transition hover:border-[rgba(0,87,255,0.4)] hover:bg-blue-50">
          Back to editor
        </Link>
      </section>

      <CourseOverview
        course={{
          id: course.id,
          titleEn: course.titleEn,
          titlePs: course.titlePs,
          titleDa: course.titleDa,
          descriptionEn: course.descriptionEn,
          descriptionPs: course.descriptionPs,
          descriptionDa: course.descriptionDa,
          level: course.level,
          isPaid: course.isPaid,
          priceCents: course.priceCents,
          currency: course.currency,
          modules: course.modules.map((module) => ({
            id: module.id,
            titleEn: module.titleEn,
            titlePs: module.titlePs,
            titleDa: module.titleDa,
            order: module.order,
            lessons: module.lessons.map((lesson) => ({
              id: lesson.id,
              order: lesson.order,
              type: lesson.type,
              titleEn: lesson.titleEn,
              titlePs: lesson.titlePs,
              titleDa: lesson.titleDa
            }))
          })),
          author: course.authorProfile ?? authorFallback,
          instructors: course.instructors.map((item) => item.profile)
        }}
        isEnrolled={false}
        progressPercent={0}
        discussionThreads={[]}
        instructorUserId={course.author.id}
        viewerId={null}
        viewerRole={null}
        studentName="Student"
        lessonStatuses={{}}
        relatedCourses={[]}
        announcements={[]}
        previewMode
        previewBackHref={`/educator/courses/${course.id}`}
      />
    </div>
  );
}
