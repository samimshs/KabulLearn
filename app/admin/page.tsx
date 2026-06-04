import { redirect } from "next/navigation";
import { CourseStatus, LessonType, QuestionType, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { publishCourse, rejectCourse } from "@/lib/actions/course-actions";
import { resetUserPassword, updateUserRole } from "@/lib/actions/user-actions";
import { saveReviewChecklistItem } from "@/lib/actions/review-checklist-actions";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { DeleteCourseButton } from "@/components/educator/DeleteCourseButton";

function statusLabel(status: CourseStatus) {
  return status.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
}

function roleLabel(role: UserRole) {
  return role[0] + role.slice(1).toLowerCase();
}

function statusClass(status: CourseStatus) {
  if (status === CourseStatus.PUBLISHED) {
    return "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]";
  }
  if (status === CourseStatus.PENDING_REVIEW) {
    return "border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] text-[var(--warning)]";
  }
  return "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
}

function roleClass(role: UserRole) {
  if (role === UserRole.ADMIN) {
    return "border-[#26364f] bg-[#07111f] text-white";
  }
  if (role === UserRole.EDUCATOR) {
    return "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]";
  }
  return "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)]";
}

async function handlePublish(formData: FormData) {
  "use server";
  await publishCourse({ courseId: String(formData.get("courseId") || "") });
}

async function handleReject(formData: FormData) {
  "use server";
  await rejectCourse({
    courseId: String(formData.get("courseId") || ""),
    reviewNote: String(formData.get("reviewNote") || "")
  });
}

async function handleUpdateUserRole(formData: FormData) {
  "use server";
  await updateUserRole({
    userId: String(formData.get("userId") || ""),
    role: String(formData.get("role") || "") as UserRole
  });
}

async function handleResetUserPassword(formData: FormData) {
  "use server";
  await resetUserPassword({
    userId: String(formData.get("userId") || ""),
    password: String(formData.get("password") || "")
  });
}

async function handleSaveChecklistItem(formData: FormData) {
  "use server";
  await saveReviewChecklistItem({
    courseId: String(formData.get("courseId") || ""),
    label: String(formData.get("label") || ""),
    passed: String(formData.get("passed") || "") === "on",
    note: String(formData.get("note") || "")
  });
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin");
  }
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const roleFilter = Object.values(UserRole).includes(resolvedSearchParams?.role as UserRole)
    ? resolvedSearchParams?.role as UserRole
    : "";

  type AdminCourse = {
    id: string; slug: string; status: CourseStatus; titleEn: string; descriptionEn: string; reviewNote: string | null;
    author: { name: string | null; email: string };
    _count: { modules: number; enrollments: number };
    modules: Array<{
      id: string;
      order: number;
      titleEn: string;
      descriptionEn: string | null;
      lessons: Array<{
        id: string;
        order: number;
        type: LessonType;
        titleEn: string;
        descriptionEn: string | null;
        youtubeUrl: string | null;
        readingEn: string | null;
        isFinalTest: boolean;
        passingScore: number | null;
        quiz: {
          questions: Array<{
            id: string;
            type: QuestionType;
            promptEn: string;
            correctAnswer: string | null;
            choices: Array<{ isCorrect: boolean }>;
          }>;
        } | null;
      }>;
    }>;
    reviewEvents: Array<{
      id: string;
      type: string;
      note: string | null;
      createdAt: Date;
      actor: { name: string | null; email: string };
    }>;
    reviewChecklistItems: Array<{
      id: string;
      label: string;
      passed: boolean;
      note: string | null;
    }>;
  };
  type AdminUser = { id: string; name: string | null; email: string; role: UserRole };

  let courses: AdminCourse[] = [];
  let users: AdminUser[] = [];
  let totalEnrollments = 0;
  let totalSubmissions = 0;
  let dbError = false;

  try {
    const [c, u, e, s] = await Promise.all([
      db.course.findMany({
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true, slug: true, status: true, titleEn: true, descriptionEn: true, reviewNote: true,
          author: { select: { name: true, email: true } },
          _count: { select: { modules: true, enrollments: true } },
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              titleEn: true,
              descriptionEn: true,
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  order: true,
                  type: true,
                  titleEn: true,
                  descriptionEn: true,
                  youtubeUrl: true,
                  readingEn: true,
                  isFinalTest: true,
                  passingScore: true,
                  quiz: {
                    select: {
                      questions: {
                        orderBy: { order: "asc" },
                        select: {
                          id: true,
                          type: true,
                          promptEn: true,
                          correctAnswer: true,
                          choices: {
                            select: { isCorrect: true }
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
            take: 5,
            select: {
              id: true,
              type: true,
              note: true,
              createdAt: true,
              actor: { select: { name: true, email: true } }
            }
          },
          reviewChecklistItems: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              label: true,
              passed: true,
              note: true
            }
          }
        }
      }),
      db.user.findMany({
        orderBy: [{ role: "desc" }, { email: "asc" }],
        where: roleFilter ? { role: roleFilter as UserRole } : undefined,
        select: { id: true, name: true, email: true, role: true }
      }),
      db.enrollment.count(),
      db.quizSubmission.count()
    ]);
    courses = c as AdminCourse[];
    users = u;
    totalEnrollments = e;
    totalSubmissions = s;
  } catch {
    dbError = true;
  }

  const draftCount = courses.filter((c) => c.status === CourseStatus.DRAFT).length;
  const reviewCount = courses.filter((c) => c.status === CourseStatus.PENDING_REVIEW).length;
  const publishedCount = courses.filter((c) => c.status === CourseStatus.PUBLISHED).length;
  const pendingCourses = courses.filter((c) => c.status === CourseStatus.PENDING_REVIEW);

  const metrics = [
    { label: "Pending", value: reviewCount, tone: "text-[var(--warning)]" },
    { label: "Published", value: publishedCount, tone: "text-[var(--success)]" },
    { label: "Drafts", value: draftCount, tone: "text-[var(--muted)]" },
    { label: "Users", value: users.length, tone: "text-[var(--brand)]" },
    { label: "Enrollments", value: totalEnrollments, tone: "text-[var(--ink)]" },
    { label: "Submissions", value: totalSubmissions, tone: "text-[var(--ink)]" }
  ];

  return (
    <main className="pr-page grid gap-6">
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[#26364f] bg-[#07111f] shadow-[0_24px_70px_rgba(4,11,25,0.24)]">
        <div className="grid gap-8 p-7 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
          <div>
            <p className="pr-eyebrow text-[#7ea7ff]">Admin Console</p>
            <h1 className="mt-4 text-[clamp(34px,5vw,58px)] font-[800] leading-[1.02] tracking-[-1.2px] text-white">
              Platform operations
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-[600] leading-7 text-[#b7c4d8]">
              Review course submissions, manage user access, and handle account recovery from one controlled workspace.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[#26364f] bg-[#0b182b] p-4 font-mono text-xs leading-6 text-[#9fb4d3] lg:min-w-72">
            <p>session.role = ADMIN</p>
            <p>access.scope = privileged</p>
            <p>review.queue = {reviewCount}</p>
          </div>
        </div>
      </section>

      {dbError ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-8 text-center">
          <p className="pr-eyebrow text-[var(--warning)]">Database unavailable</p>
          <p className="mt-2 font-[700] text-[var(--warning)]">
            Could not load dashboard data. Please refresh in a moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" aria-label="Admin metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
                <p className={`text-[28px] font-[800] leading-none tracking-[-0.5px] ${metric.tone}`}>
                  {metric.value.toLocaleString()}
                </p>
                <p className="mt-2 text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">
                  {metric.label}
                </p>
              </div>
            ))}
          </section>

          <section className="pr-card overflow-hidden">
            <div className="border-b border-[var(--border)] bg-white p-5 lg:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="pr-eyebrow">Course inventory</p>
                  <h2 className="pr-h2 mt-2">All courses</h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                  {courses.length} total
                </span>
              </div>
            </div>
            {courses.length === 0 ? (
              <div className="p-6">
                <div className="pr-muted-box text-center font-[800] text-[var(--muted)]">
                  No courses found.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead className="bg-[var(--surface)]">
                    <tr className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Author</th>
                      <th className="px-5 py-3">Activity</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white">
                    {courses.map((course) => (
                      <tr key={course.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-[800] text-[var(--ink)]">{course.titleEn}</p>
                          <p className="mt-1 max-w-md line-clamp-2 text-sm font-[500] leading-6 text-[var(--muted)]">{course.descriptionEn}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-[800] uppercase tracking-[1px] ${statusClass(course.status)}`}>
                            {statusLabel(course.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-[700] text-[var(--ink-2)]">
                          {course.author.name ?? course.author.email}
                        </td>
                        <td className="px-5 py-4 text-sm font-[700] text-[var(--muted)]">
                          {course._count.modules} modules · {course._count.enrollments} enrollments
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <DeleteCourseButton courseId={course.id} label={course.titleEn} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="pr-card overflow-hidden">
            <div className="border-b border-[var(--border)] bg-white p-5 lg:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="pr-eyebrow">Review queue</p>
                  <h2 className="pr-h2 mt-2">Courses awaiting review</h2>
                </div>
                <span className="rounded-full border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--warning)]">
                  {pendingCourses.length} pending
                </span>
              </div>
            </div>

            {pendingCourses.length === 0 ? (
              <div className="p-6">
                <div className="pr-muted-box text-center font-[800] text-[var(--muted)]">
                  No courses are waiting for review right now.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {pendingCourses.map((course) => (
                  <article key={course.id} className="grid gap-5 bg-white p-5 lg:p-6">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-[800] uppercase tracking-[1px] ${statusClass(course.status)}`}>
                            {statusLabel(course.status)}
                          </span>
                          <span className="truncate text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                            {course.slug}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-[800] tracking-[-0.35px] text-[var(--ink)]">
                          {course.titleEn}
                        </h3>
                        <p className="mt-2 max-w-4xl text-sm font-[500] leading-6 text-[var(--muted)]">
                          {course.descriptionEn}
                        </p>
                        <p className="mt-3 text-sm font-[700] text-[var(--ink-2)]">
                          {course.author.name || course.author.email}
                          <span className="text-[var(--muted)]"> · {course._count.modules} modules · {course._count.enrollments} enrollments</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <form action={handlePublish}>
                          <input type="hidden" name="courseId" value={course.id} />
                          <button type="submit" className="inline-flex min-h-[40px] items-center justify-center rounded-[var(--radius)] bg-[var(--success)] px-4 text-sm font-[800] text-white transition hover:bg-[#126b4b]">
                            Publish
                          </button>
                        </form>
                        <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
                          <summary className="cursor-pointer list-none px-4 py-2 text-sm font-[800] text-[var(--danger)]">
                            Return
                          </summary>
                          <form action={handleReject} className="grid gap-2 border-t border-[var(--border)] p-3">
                          <input type="hidden" name="courseId" value={course.id} />
                            <textarea
                              name="reviewNote"
                              required
                              minLength={5}
                              placeholder="Reason for return"
                              className="pr-input min-h-24 w-72"
                            />
                          <button type="submit" className="pr-btn-danger !min-h-10 px-4">
                              Send note
                          </button>
                          </form>
                        </details>
                      </div>
                    </div>

                    <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-[800] text-[var(--brand)]">
                        Review course content
                      </summary>
                      <div className="grid gap-4 border-t border-[var(--border)] p-4">
                        {course.modules.length === 0 ? (
                          <div className="rounded-[var(--radius)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-4 py-3 text-sm font-[800] text-[var(--warning)]">
                            No modules have been added yet. Return this course to draft before publishing.
                          </div>
                        ) : (
                          course.modules.map((module) => (
                            <section key={module.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-[800] uppercase tracking-[1.5px] text-[var(--muted)]">
                                    Module {module.order}
                                  </p>
                                  <h4 className="mt-1 text-base font-[800] text-[var(--ink)]">{module.titleEn}</h4>
                                  {module.descriptionEn ? (
                                    <p className="mt-2 text-sm font-[500] leading-6 text-[var(--muted)]">{module.descriptionEn}</p>
                                  ) : null}
                                </div>
                                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-[800] text-[var(--muted)]">
                                  {module.lessons.length} lessons
                                </span>
                              </div>

                              {module.lessons.length === 0 ? (
                                <p className="mt-4 rounded-[var(--radius)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-4 py-3 text-sm font-[800] text-[var(--warning)]">
                                  This module has no lessons.
                                </p>
                              ) : (
                                <div className="mt-4 grid gap-3">
                                  {module.lessons.map((lesson) => (
                                    <article key={lesson.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] px-2.5 py-1 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--brand)]">
                                          {lesson.type}
                                        </span>
                                        <span className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                                          Lesson {lesson.order}
                                        </span>
                                        {lesson.isFinalTest ? (
                                          <span className="rounded-full border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-2.5 py-1 text-[11px] font-[800] uppercase tracking-[1px] text-[var(--warning)]">
                                            Final test · {lesson.passingScore ?? 80}%
                                          </span>
                                        ) : null}
                                      </div>
                                      <h5 className="mt-2 text-sm font-[800] text-[var(--ink)]">{lesson.titleEn}</h5>
                                      {lesson.descriptionEn ? (
                                        <p className="mt-1 text-sm font-[500] leading-6 text-[var(--muted)]">{lesson.descriptionEn}</p>
                                      ) : null}
                                      {lesson.type === LessonType.VIDEO ? (
                                        <p className="mt-2 break-all text-xs font-[700] text-[var(--brand)]">
                                          {lesson.youtubeUrl ?? "Missing YouTube URL"}
                                        </p>
                                      ) : null}
                                      {lesson.type === LessonType.READING && lesson.readingEn ? (
                                        <p className="mt-2 line-clamp-3 text-sm font-[500] leading-6 text-[var(--muted)]">
                                          {lesson.readingEn}
                                        </p>
                                      ) : null}
                                      {lesson.type === LessonType.QUIZ ? (
                                        <div className="mt-2 grid gap-2">
                                          <p className="text-sm font-[700] text-[var(--muted)]">
                                            {lesson.quiz?.questions.length ?? 0} questions
                                          </p>
                                          {lesson.quiz?.questions.slice(0, 3).map((question) => (
                                            <div key={question.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2">
                                              <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                                                {question.type === QuestionType.TEXT_INPUT
                                                  ? "Text / math answer"
                                                  : question.type === QuestionType.MULTIPLE_CHOICE
                                                    ? "Multiple choice"
                                                    : "Single choice"}
                                              </p>
                                              <p className="mt-1 text-sm font-[700] text-[var(--ink-2)]">{question.promptEn}</p>
                                              {question.type === QuestionType.TEXT_INPUT ? (
                                                <p className="mt-1 text-xs font-[800] text-[var(--brand)]">
                                                  Correct answer: {question.correctAnswer ?? "Missing"}
                                                </p>
                                              ) : (
                                                <p className="mt-1 text-xs font-[800] text-[var(--brand)]">
                                                  {question.choices.filter((choice) => choice.isCorrect).length} correct choice(s)
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </article>
                                  ))}
                                </div>
                              )}
                            </section>
                          ))
                        )}
                      </div>
                    </details>
                    {course.reviewEvents.length > 0 ? (
                      <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-[800] text-[var(--brand)]">
                          Review history
                        </summary>
                        <div className="grid gap-2 border-t border-[var(--border)] p-4">
                          {course.reviewEvents.map((event) => (
                            <div key={event.id} className="rounded-[var(--radius)] bg-[var(--surface)] p-3">
                              <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                                {event.type} · {event.createdAt.toLocaleString()} · {event.actor.name ?? event.actor.email}
                              </p>
                              {event.note ? <p className="mt-1 text-sm font-[600] text-[var(--ink-2)]">{event.note}</p> : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                    <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-[800] text-[var(--brand)]">
                        Review checklist
                      </summary>
                      <div className="grid gap-3 border-t border-[var(--border)] p-4">
                        {["Clear learning outcome", "Complete lesson content", "Quiz answers verified", "Bilingual student content", "No broken links"].map((label) => {
                          const item = course.reviewChecklistItems.find((entry) => entry.label === label);
                          return (
                            <form key={label} action={handleSaveChecklistItem} className="grid gap-2 rounded-[var(--radius)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                              <input type="hidden" name="courseId" value={course.id} />
                              <input type="hidden" name="label" value={label} />
                              <label className="flex items-center gap-2 text-sm font-[800] text-[var(--ink-2)]">
                                <input name="passed" type="checkbox" defaultChecked={item?.passed ?? false} />
                                {label}
                              </label>
                              <input name="note" defaultValue={item?.note ?? ""} placeholder="Optional note" className="pr-input sm:min-w-64" />
                              <button type="submit" className="pr-btn-secondary !min-h-9 sm:col-span-2">
                                Save checklist item
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="pr-card overflow-hidden">
            <div className="border-b border-[var(--border)] bg-white p-5 lg:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="pr-eyebrow">Access control</p>
                  <h2 className="pr-h2 mt-2">Users and roles</h2>
                </div>
                <p className="max-w-lg text-sm font-[500] leading-6 text-[var(--muted)]">
                  Promote educators, protect admin access, issue temporary recovery passwords, and remove test users.
                </p>
              </div>
              <form className="mt-4 flex flex-wrap gap-2" action="/admin">
                <select name="role" defaultValue={roleFilter} className="pr-input max-w-56">
                  <option value="">All roles</option>
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{roleLabel(role)}</option>
                  ))}
                </select>
                <button type="submit" className="pr-btn-secondary !min-h-10">Filter</button>
              </form>
            </div>

            {users.length === 0 ? (
              <div className="p-6">
                <div className="pr-muted-box text-center font-[800] text-[var(--muted)]">
                  No users found.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left">
                  <thead className="bg-[var(--surface)]">
                    <tr className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Current role</th>
                      <th className="px-5 py-3">Change role</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white">
                    {users.map((user) => (
                      <tr key={user.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-[800] text-[var(--ink)]">{user.name ?? "Unnamed user"}</p>
                          <p className="mt-1 text-sm font-[500] text-[var(--muted)]">{user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-[800] uppercase tracking-[1px] ${roleClass(user.role)}`}>
                            {roleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.values(UserRole).map((roleOption) => (
                              <form key={roleOption} action={handleUpdateUserRole}>
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="role" value={roleOption} />
                                <button
                                  type="submit"
                                  disabled={roleOption === user.role}
                                  className={`inline-flex h-9 min-w-24 items-center justify-center rounded-[var(--radius)] px-3 text-xs font-[800] transition ${
                                    roleOption === user.role
                                      ? "cursor-not-allowed border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                                      : "border border-[var(--border)] bg-white text-[var(--ink)] hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--brand)]"
                                  }`}
                                >
                                  {roleLabel(roleOption)}
                                </button>
                              </form>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <details className="group ms-auto w-72 max-w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
                            <summary className="cursor-pointer list-none px-4 py-2 text-right text-xs font-[800] uppercase tracking-[1px] text-[var(--brand)]">
                              Reset password
                            </summary>
                            <form action={handleResetUserPassword} className="grid gap-2 border-t border-[var(--border)] p-3">
                              <input type="hidden" name="userId" value={user.id} />
                              <label className="sr-only" htmlFor={`password-${user.id}`}>
                                Temporary password
                              </label>
                              <input
                                id={`password-${user.id}`}
                                name="password"
                                type="text"
                                minLength={8}
                                placeholder="Temporary password"
                                className="pr-input"
                              />
                              <button type="submit" className="pr-btn-secondary !min-h-9 w-full">
                                Save temporary password
                              </button>
                            </form>
                          </details>
                          <div className="mt-2 text-right">
                            <DeleteUserButton userId={user.id} label={user.email} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
