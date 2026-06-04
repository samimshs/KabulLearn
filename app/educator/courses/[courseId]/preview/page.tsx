import Link from "next/link";
import { LessonType, UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canManageCourse } from "@/lib/rbac";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";

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
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { quiz: { include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } } } }
          }
        }
      }
    }
  });

  if (!course || !canManageCourse({ requesterId: session.user.id, requesterRole: session.user.role, authorId: course.authorId })) {
    notFound();
  }

  return (
    <main className="pr-page grid gap-6">
      <section className="pr-panel p-7 lg:p-10">
        <p className="pr-eyebrow">Draft preview</p>
        <h1 className="pr-h1 mt-4">{course.titleEn}</h1>
        <p className="pr-copy mt-5 max-w-3xl">{course.descriptionEn}</p>
        <Link href={`/educator/courses/${course.id}`} className="pr-btn-ghost mt-6">
          Back to editor
        </Link>
      </section>

      <section className="grid gap-5">
        {course.modules.map((module) => (
          <article key={module.id} className="pr-card grid gap-4 p-5 lg:p-6">
            <div>
              <p className="pr-eyebrow">Module {module.order}</p>
              <h2 className="pr-h2 mt-2">{module.titleEn}</h2>
              {module.descriptionEn ? <p className="pr-copy mt-3">{module.descriptionEn}</p> : null}
            </div>
            <div className="grid gap-3">
              {module.lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pr-badge">{lesson.type}</span>
                    <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">Lesson {lesson.order}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-[800] text-[var(--ink)]">{lesson.titleEn}</h3>
                  {lesson.descriptionEn ? <p className="mt-2 text-sm font-[600] leading-6 text-[var(--muted)]">{lesson.descriptionEn}</p> : null}
                  {lesson.type === LessonType.READING && lesson.readingEn ? (
                    <div className="mt-4 rounded-[var(--radius)] bg-white p-4">
                      <SimpleMarkdown content={lesson.readingEn} />
                    </div>
                  ) : null}
                  {lesson.type === LessonType.VIDEO && lesson.youtubeUrl ? (
                    <p className="mt-4 break-all text-sm font-[800] text-[var(--brand)]">{lesson.youtubeUrl}</p>
                  ) : null}
                  {lesson.type === LessonType.QUIZ ? (
                    <p className="mt-4 text-sm font-[800] text-[var(--muted)]">
                      {lesson.quiz?.questions.length ?? 0} question{(lesson.quiz?.questions.length ?? 0) === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
