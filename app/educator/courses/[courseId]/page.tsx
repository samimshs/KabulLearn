import Link from "next/link";
import { CourseStatus, UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { dictionaries } from "@/lib/i18n";
import { canManageCourse } from "@/lib/rbac";
import { getServerLocale } from "@/lib/server-locale";
import { CourseCreateForm } from "@/components/educator/CourseCreateForm";
import { CourseSubmitButton } from "@/components/educator/CourseSubmitButton";

type EducatorCoursePageProps = {
  params?: Promise<{ courseId: string }>;
};

function fallbackUsername(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "course-instructor";
}

export default async function EducatorCoursePage(props: EducatorCoursePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Feducator");
  }
  if (session.user.role === UserRole.ADMIN) {
    redirect("/admin");
  }
  if (session.user.role !== UserRole.EDUCATOR) {
    redirect("/dashboard");
  }

  const rawParams = await props.params;
  const params = rawParams ? { courseId: decodeURIComponent(rawParams.courseId) } : null;
  if (!params?.courseId) notFound();

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      authorProfile: {
        select: {
          username: true,
          name: true,
          professionalTitle: true,
          professionalTitlePs: true,
          professionalTitleDa: true,
          bio: true,
          bioPs: true,
          bioDa: true,
          avatarUrl: true,
          linkedinUrl: true,
          youtubeUrl: true
        }
      },
      instructors: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          profile: {
            select: {
              username: true,
              name: true,
              professionalTitle: true,
              professionalTitlePs: true,
              professionalTitleDa: true,
              bio: true,
              bioPs: true,
              bioDa: true,
              avatarUrl: true,
              linkedinUrl: true,
              youtubeUrl: true
            }
          }
        }
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              quiz: {
                include: {
                  questions: {
                    orderBy: { order: "asc" },
                    include: {
                      choices: { orderBy: { order: "asc" } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!course || !canManageCourse({ requesterId: session.user.id, requesterRole: session.user.role, authorId: course.authorId })) {
    notFound();
  }

  const locale = await getServerLocale();
  const t = dictionaries[locale];
  const instructors = course.instructors.length
    ? course.instructors
      .sort((a, b) => a.order - b.order)
      .map((ci) => ({
        name: ci.profile.name,
        username: ci.profile.username,
        title: ci.profile.professionalTitle ?? undefined,
        titlePs: ci.profile.professionalTitlePs ?? undefined,
        titleDa: ci.profile.professionalTitleDa ?? undefined,
        bio: ci.profile.bio ?? undefined,
        bioPs: ci.profile.bioPs ?? undefined,
        bioDa: ci.profile.bioDa ?? undefined,
        avatarUrl: ci.profile.avatarUrl ?? undefined,
        linkedinUrl: ci.profile.linkedinUrl ?? undefined,
        youtubeUrl: ci.profile.youtubeUrl ?? undefined
      }))
    : [{
      name: course.authorProfile?.name ?? course.author.name ?? course.author.email,
      username: course.authorProfile?.username ?? fallbackUsername(course.author.email),
      title: course.authorProfile?.professionalTitle ?? undefined,
      titlePs: course.authorProfile?.professionalTitlePs ?? undefined,
      titleDa: course.authorProfile?.professionalTitleDa ?? undefined,
      bio: course.authorProfile?.bio ?? undefined,
      bioPs: course.authorProfile?.bioPs ?? undefined,
      bioDa: course.authorProfile?.bioDa ?? undefined,
      avatarUrl: course.authorProfile?.avatarUrl ?? undefined,
      linkedinUrl: course.authorProfile?.linkedinUrl ?? undefined,
      youtubeUrl: course.authorProfile?.youtubeUrl ?? undefined
    }];

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[1.6px] text-[var(--brand)]">{t.courseEditor}</p>
          <h1 className="mt-1 text-xl font-black tracking-[-0.5px] text-[var(--ink)]">{course.titleEn}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/educator/courses/${course.id}/preview`} className="pr-btn-secondary !min-h-10 px-4 text-sm">{t.preview}</Link>
          <CourseSubmitButton courseId={course.id} courseStatus={course.status} />
        </div>
      </div>

      <CourseCreateForm
        initialCourse={{
          courseId: course.id,
          status: course.status,
          slug: course.slug,
          level: (course.level ?? "") as "" | "beginner" | "intermediate" | "advanced",
          titleEn: course.titleEn,
          titlePs: course.titlePs,
          titleDa: course.titleDa ?? "",
          descriptionEn: course.descriptionEn,
          descriptionPs: course.descriptionPs,
          descriptionDa: course.descriptionDa ?? "",
          isPaid: course.isPaid,
          priceCents: course.priceCents,
          instructors,
          modules: course.modules.map((module) => ({
            id: module.id,
            titleEn: module.titleEn,
            titlePs: module.titlePs,
            titleDa: module.titleDa ?? "",
            descriptionEn: module.descriptionEn ?? "",
            lessons: module.lessons.map((lesson) => ({
              id: lesson.id,
              titleEn: lesson.titleEn,
              titlePs: lesson.titlePs,
              titleDa: lesson.titleDa ?? "",
              type: lesson.type,
              summaryEn: lesson.descriptionEn ?? "",
              summaryPs: lesson.descriptionPs ?? "",
              summaryDa: lesson.descriptionDa ?? "",
              youtubeUrl: lesson.youtubeUrl ?? "",
              readingEn: lesson.readingEn ?? "",
              readingPs: lesson.readingPs ?? "",
              readingDa: lesson.readingDa ?? "",
              resourceNote: "",
              resourceUrl: "",
              passingScore: lesson.passingScore ?? 70,
              isFinalTest: lesson.isFinalTest,
              aiGeneratedAssets: lesson.aiGeneratedAssets as {
                slides?: Array<{
                  slideNumber?: number;
                  title?: string;
                  narration?: { english?: string; dari?: string; pashto?: string };
                }>;
                videoPlan?: {
                  renderStatus?: "not_started" | "rendering" | "completed" | "failed";
                  lastRenderedAt?: string;
                  voiceLanguage?: string;
                  durationSeconds?: number;
                  lastRenderError?: string | null;
                };
              } | null,
              draftQuestions: (lesson.quiz?.questions ?? []).map((q) => ({
                id: q.id,
                promptEn: q.promptEn,
                promptPs: q.promptPs ?? "",
                promptDa: q.promptDa ?? "",
                type: q.type as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT",
                correctAnswer: q.correctAnswer ?? "",
                explanationEn: q.explanationEn ?? "",
                explanationPs: q.explanationPs ?? "",
                explanationDa: q.explanationDa ?? "",
                choices: q.choices.map((c) => ({
                  id: c.id,
                  textEn: c.textEn,
                  textPs: c.textPs ?? "",
                  textDa: c.textDa ?? "",
                  isCorrect: c.isCorrect
                }))
              }))
            }))
          }))
        }}
      />
    </main>
  );
}
