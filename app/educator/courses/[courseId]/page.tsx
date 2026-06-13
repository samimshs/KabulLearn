import Link from "next/link";
import { CourseStatus, UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canManageCourse } from "@/lib/rbac";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";
import { CourseUpdateForm } from "@/components/educator/CourseUpdateForm";
import { ModuleUpdateForm } from "@/components/educator/ModuleUpdateForm";
import { ModuleCreateForm } from "@/components/educator/ModuleCreateForm";
import { LessonCreateForm } from "@/components/educator/LessonCreateForm";
import { LessonUpdateForm } from "@/components/educator/LessonUpdateForm";
import { CourseSubmitButton } from "@/components/educator/CourseSubmitButton";
import { DeleteModuleButton } from "@/components/educator/DeleteModuleButton";
import { DeleteLessonButton } from "@/components/educator/DeleteLessonButton";
import { LessonOrderControl, ModuleOrderControl } from "@/components/educator/CourseOrderControls";

type EducatorCoursePageProps = {
  params?: Promise<{ courseId: string }>;
  searchParams?: Promise<any>;
};

function statusLabel(status: CourseStatus) {
  return status
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
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

  const educator = session.user;
  const locale = await getServerLocale();
  const t = dictionaries[locale];
  const rawParams = await props.params;
  const params = rawParams
    ? { courseId: decodeURIComponent(rawParams.courseId) }
    : null;

  if (!params?.courseId) {
    notFound();
  }

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
                select: {
                  questions: {
                    select: {
                      id: true,
                      type: true,
                      correctAnswer: true,
                      choices: {
                        select: {
                          isCorrect: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      reviewEvents: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          type: true,
          note: true,
          createdAt: true,
          actor: { select: { name: true, email: true } }
        }
      }
    }
  });

  if (!course || !canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
    notFound();
  }

  const lessonCount = course.modules.reduce((count, module) => count + module.lessons.length, 0);
  const quizQuestionCount = course.modules.reduce(
    (count, module) => count + module.lessons.reduce((lessonCount, lesson) => lessonCount + (lesson.quiz?.questions.length ?? 0), 0),
    0
  );
  const incompleteLessons = course.modules.flatMap((module) =>
    module.lessons.filter((lesson) => {
      if (lesson.type === "VIDEO") return !lesson.youtubeUrl;
      if (lesson.type === "READING") return !lesson.readingEn && !lesson.readingPs;
      if (lesson.type === "QUIZ") {
        if (!lesson.quiz || lesson.quiz.questions.length === 0) return true;
        return lesson.quiz.questions.some((question) => {
          if (question.type === "TEXT_INPUT") return !question.correctAnswer;
          return question.choices.length === 0 || !question.choices.some((choice) => choice.isCorrect);
        });
      }
      return false;
    })
  );
  const canSubmitDraft = course.status === CourseStatus.DRAFT;

  const readinessItems = [
    { ok: course.modules.length > 0, label: t.atLeastOneModule },
    { ok: lessonCount > 0, label: t.atLeastOneLesson },
    { ok: incompleteLessons.length === 0, label: incompleteLessons.length === 0 ? t.allContentComplete : `${incompleteLessons.length} incomplete lesson${incompleteLessons.length !== 1 ? "s" : ""}` },
  ];

  return (
    <main className="pr-page grid gap-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(0,87,255,0.06),rgba(255,255,255,0)_60%)] p-7 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="pr-eyebrow">{t.courseEditor}</p>
              <h1 className="mt-2 text-[20px] font-[800] tracking-tight text-[var(--ink)]">{course.titleEn}</h1>
              <p className="pr-copy mt-3 max-w-2xl">
                {t.buildCourseHint}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/educator" className="pr-btn-ghost">{t.back}</Link>
              <Link href={`/educator/courses/${course.id}/preview`} className="pr-btn-secondary">{t.preview}</Link>
              {canSubmitDraft && <CourseSubmitButton courseId={course.id} />}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 divide-x divide-[var(--border)] sm:grid-cols-4">
          {[
            { label: "Status", value: statusLabel(course.status) },
            { label: t.modules, value: course.modules.length },
            { label: t.lessons, value: lessonCount },
            { label: "Quiz questions", value: quizQuestionCount },
          ].map((s) => (
            <div key={s.label} className="px-5 py-4">
              <p className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">{s.label}</p>
              <p className="mt-1 text-[20px] font-[800] text-[var(--ink)]">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Readiness + alerts ───────────────────────────────── */}
      {(canSubmitDraft || course.reviewNote || course.reviewEvents.length > 0) && (
        <div className="grid gap-3">
          {canSubmitDraft && (
            <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-3">
              {readinessItems.map((item) => (
                <div key={item.label} className={`flex items-center gap-2 text-[13px] font-[700] ${item.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-[800] text-white ${item.ok ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}>
                    {item.ok ? "✓" : "✗"}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          )}
          {course.reviewNote && course.status === CourseStatus.DRAFT && (
            <div className="flex gap-3 rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-5 py-4">
              <span className="shrink-0 text-[var(--warning)]">⚠</span>
              <p className="text-[13px] font-[700] leading-6 text-[var(--warning)]">
                <span className="font-[800]">{t.adminNote} </span>{course.reviewNote}
              </p>
            </div>
          )}
          {course.reviewEvents.length > 0 && (
            <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]">
              <summary className="cursor-pointer px-5 py-4 text-[13px] font-[800] text-[var(--brand)] marker:content-none">
                {t.reviewHistory} ({course.reviewEvents.length})
              </summary>
              <div className="grid gap-2 border-t border-[var(--border)] p-4">
                {course.reviewEvents.map((event) => (
                  <div key={event.id} className="rounded-[var(--radius)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                      {event.type} · {event.createdAt.toLocaleString()} · {event.actor.name ?? event.actor.email}
                    </p>
                    {event.note && <p className="mt-1 text-[13px] font-[600] text-[var(--ink-2)]">{event.note}</p>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── Two-column editor ────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        {/* Left: Course metadata + new module form */}
        <div className="grid gap-5 auto-rows-min">
          <CourseUpdateForm
            courseId={course.id}
            slug={course.slug}
            level={course.level}
            titleEn={course.titleEn}
            titlePs={course.titlePs}
            titleDa={course.titleDa}
            descriptionEn={course.descriptionEn}
            descriptionPs={course.descriptionPs}
            descriptionDa={course.descriptionDa}
            isPaid={course.isPaid}
            priceCents={course.priceCents}
            status={course.status}
            instructors={course.instructors
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
                youtubeUrl: ci.profile.youtubeUrl ?? undefined,
              }))}
          />
          <ModuleCreateForm courseId={course.id} />
        </div>

        {/* Right: Module & lesson structure */}
        <div className="grid gap-5 auto-rows-min">
          <div className="flex items-center justify-between">
            <div>
              <p className="pr-eyebrow">Modules</p>
              <h2 className="pr-h2 mt-1">Course structure</h2>
            </div>
          </div>

          {course.modules.length === 0 ? (
            <div className="pr-muted-box py-10 text-center text-[14px] font-[700] text-[var(--muted)]">
              No modules yet — add one using the form on the left.
            </div>
          ) : (
            <div className="grid gap-4">
              <ModuleOrderControl
                courseId={course.id}
                modules={course.modules.map((m) => ({
                  id: m.id,
                  label: m.titleEn,
                  meta: `${m.lessons.length} lesson${m.lessons.length !== 1 ? "s" : ""}`
                }))}
              />

              {course.modules.map((module) => (
                <article
                  key={module.id}
                  className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]"
                >
                  {/* Module header */}
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(0,87,255,0.04),rgba(255,255,255,0))] p-5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-[800] uppercase tracking-[1.5px] text-[var(--brand)]">Module {module.order}</p>
                      <h3 className="mt-1 text-[16px] font-[800] tracking-tight text-[var(--ink)]">{module.titleEn}</h3>
                      {module.descriptionEn && (
                        <p className="mt-1 line-clamp-2 text-[13px] text-[var(--muted)]">{module.descriptionEn}</p>
                      )}
                    </div>
                    <DeleteModuleButton moduleId={module.id} />
                  </div>

                  {/* Collapsible module edit form */}
                  <details className="border-b border-[var(--border)]">
                    <summary className="cursor-pointer px-5 py-3 text-[12px] font-[800] uppercase tracking-[1px] text-[var(--brand)] marker:content-none hover:bg-[var(--surface)]">
                      Edit module details ▾
                    </summary>
                    <div className="border-t border-[var(--border)] p-5">
                      <ModuleUpdateForm
                        courseId={course.id}
                        moduleId={module.id}
                        titleEn={module.titleEn}
                        titlePs={module.titlePs}
                        titleDa={module.titleDa}
                        descriptionEn={module.descriptionEn}
                        descriptionPs={module.descriptionPs}
                        descriptionDa={module.descriptionDa}
                      />
                    </div>
                  </details>

                  {/* Lessons */}
                  <div className="p-5">
                    <p className="pr-eyebrow mb-3">Lessons</p>

                    {module.lessons.length === 0 ? (
                      <p className="text-[13px] text-[var(--muted)]">No lessons yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        <LessonOrderControl
                          moduleId={module.id}
                          lessons={module.lessons.map((l) => ({
                            id: l.id, label: l.titleEn, meta: l.type
                          }))}
                        />
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
                          >
                            {/* Lesson summary row */}
                            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                              <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-[800] uppercase tracking-[1px] ${
                                  lesson.type === "VIDEO" ? "bg-[var(--brand-50)] text-[var(--brand)]" :
                                  lesson.type === "QUIZ" ? "bg-[var(--warning-50)] text-[var(--warning)]" :
                                  "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
                                }`}>
                                  {lesson.type}
                                </span>
                                {lesson.isFinalTest && (
                                  <span className="rounded-full border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-2 py-0.5 text-[10px] font-[800] uppercase tracking-[1px] text-[var(--warning)]">
                                    Final test
                                  </span>
                                )}
                                <span className="truncate text-[13px] font-[700] text-[var(--ink)]">{lesson.titleEn}</span>
                                {lesson.type === "QUIZ" && (
                                  <span className="text-[11px] text-[var(--muted)]">{lesson.quiz?.questions.length ?? 0} questions</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {lesson.type === "QUIZ" && (
                                  <Link
                                    href={`/educator/courses/${course.id}/quizzes/${lesson.id}`}
                                    className="pr-btn-secondary !min-h-8 px-3 text-[12px]"
                                  >
                                    Edit quiz
                                  </Link>
                                )}
                                <DeleteLessonButton lessonId={lesson.id} />
                              </div>
                            </div>

                            {/* Collapsible lesson edit form */}
                            <details className="border-t border-[var(--border)]">
                              <summary className="cursor-pointer px-4 py-2 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)] marker:content-none hover:bg-[var(--border)]/30">
                                Edit lesson ▾
                              </summary>
                              <div className="border-t border-[var(--border)] p-4">
                                <LessonUpdateForm lesson={lesson} />
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <LessonCreateForm courseId={course.id} moduleId={module.id} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
