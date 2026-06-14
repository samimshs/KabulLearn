import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CourseStatus, EducatorRequestStatus, LessonType, QuestionType, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { publishCourse, rejectCourse } from "@/lib/actions/course-actions";
import { resetUserPassword, updateUserRole } from "@/lib/actions/user-actions";
import { saveReviewChecklistItem } from "@/lib/actions/review-checklist-actions";
import { approveEducatorRequest, rejectEducatorRequest } from "@/lib/actions/educator-request-actions";
import { getSiteVideoUrls } from "@/lib/actions/site-settings-actions";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { DeleteCourseButton } from "@/components/educator/DeleteCourseButton";
import { AdminComposeForm, type AdminMessageHistoryItem } from "@/components/admin/AdminComposeForm";
import { AdminSiteVideosForm } from "@/components/admin/AdminSiteVideosForm";
import { ReindexButton } from "@/components/admin/ReindexButton";

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

function coursePriceLabel(course: { isPaid: boolean; priceCents: number | null }) {
  if (!course.isPaid) return "Free";
  if (!course.priceCents) return "Paid, price missing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(course.priceCents / 100);
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

function AdminFoldout({
  title,
  eyebrow,
  description,
  badge,
  defaultOpen = false,
  children
}: {
  title: string;
  eyebrow: string;
  description?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-[var(--radius-xl)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="pr-eyebrow">{eyebrow}</p>
          <h2 className="mt-1 text-[20px] font-[800] tracking-[-0.35px] text-[var(--ink)]">{title}</h2>
          {description ? <p className="mt-1 text-sm font-[600] leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition group-open:rotate-180">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </summary>
      <div className="border-t border-[var(--border)]">
        {children}
      </div>
    </details>
  );
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
    role: String(formData.get("role") || "") as UserRole,
    adminPassword: String(formData.get("adminPassword") || "")
  });
}

async function handleResetUserPassword(formData: FormData) {
  "use server";
  await resetUserPassword({
    userId: String(formData.get("userId") || ""),
    password: String(formData.get("password") || ""),
    adminPassword: String(formData.get("adminPassword") || "")
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

async function handleApproveEducatorRequest(formData: FormData) {
  "use server";
  await approveEducatorRequest({
    requestId: String(formData.get("requestId") || ""),
    adminNote: String(formData.get("adminNote") || "")
  });
}

async function handleRejectEducatorRequest(formData: FormData) {
  "use server";
  await rejectEducatorRequest({
    requestId: String(formData.get("requestId") || ""),
    adminNote: String(formData.get("adminNote") || "")
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
    isPaid: boolean; priceCents: number | null;
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
  type EducatorReq = {
    id: string;
    message: string;
    status: EducatorRequestStatus;
    adminNote: string | null;
    createdAt: Date;
    user: { id: string; name: string | null; email: string };
  };

  let courses: AdminCourse[] = [];
  let users: AdminUser[] = [];
  let educatorRequests: EducatorReq[] = [];
  let totalEnrollments = 0;
  let totalSubmissions = 0;
  let siteVideos: Record<string, string> = {};
  let totalUsers = 0;
  let dau = 0;
  let wau = 0;
  let topCourses: Array<{ id: string; titleEn: string; _count: { enrollments: number } }> = [];
  let recentSignups: Array<{ id: string; name: string | null; email: string; createdAt: Date; role: UserRole }> = [];
  let adminMessageHistory: AdminMessageHistoryItem[] = [];
  let dbError = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

  try {
    const [c, u, e, s, er, sv, tu, dauCount, wauCount, tc, rs, sentMessages] = await Promise.all([
      db.course.findMany({
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true, slug: true, status: true, titleEn: true, descriptionEn: true, reviewNote: true,
          isPaid: true, priceCents: true,
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
      db.quizSubmission.count(),
      db.educatorRequest.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        select: {
          id: true, message: true, status: true, adminNote: true, createdAt: true,
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      getSiteVideoUrls(),
      db.user.count(),
      db.userStreak.count({ where: { lastActiveDate: { gte: today } } }),
      db.userStreak.count({ where: { lastActiveDate: { gte: sevenDaysAgo } } }),
      db.course.findMany({
        where: { status: CourseStatus.PUBLISHED },
        orderBy: { enrollments: { _count: "desc" } },
        take: 5,
        select: { id: true, titleEn: true, _count: { select: { enrollments: true } } }
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, createdAt: true, role: true }
      }),
      db.directMessage.findMany({
        where: { senderId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          body: true,
          createdAt: true,
          recipient: { select: { name: true, email: true } }
        }
      })
    ]);
    courses = c as AdminCourse[];
    users = u;
    totalEnrollments = e;
    totalSubmissions = s;
    educatorRequests = er as EducatorReq[];
    siteVideos = sv;
    totalUsers = tu;
    dau = dauCount;
    wau = wauCount;
    topCourses = tc;
    recentSignups = rs;
    const grouped = new Map<string, AdminMessageHistoryItem>();
    for (const message of sentMessages) {
      const bucketTime = Math.floor(message.createdAt.getTime() / 1000);
      const key = `${bucketTime}:${message.body}`;
      const recipient = message.recipient.name ?? message.recipient.email;
      const current = grouped.get(key);
      if (current) {
        current.recipientCount += 1;
        current.recipients.push(recipient);
      } else {
        grouped.set(key, {
          id: message.id,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          recipientCount: 1,
          recipients: [recipient]
        });
      }
    }
    adminMessageHistory = Array.from(grouped.values()).slice(0, 12);
  } catch {
    dbError = true;
  }

  const draftCount = courses.filter((c) => c.status === CourseStatus.DRAFT).length;
  const reviewCount = courses.filter((c) => c.status === CourseStatus.PENDING_REVIEW).length;
  const publishedCount = courses.filter((c) => c.status === CourseStatus.PUBLISHED).length;
  const pendingCourses = courses.filter((c) => c.status === CourseStatus.PENDING_REVIEW);
  const pendingRequests = educatorRequests.filter((r) => r.status === EducatorRequestStatus.PENDING);

  const metrics = [
    { label: "Courses pending", value: reviewCount, tone: "text-[var(--warning)]" },
    { label: "Access requests", value: pendingRequests.length, tone: pendingRequests.length > 0 ? "text-[#7C3AED]" : "text-[var(--muted)]" },
    { label: "Published", value: publishedCount, tone: "text-[var(--success)]" },
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
            <div className="mt-3 flex flex-wrap gap-2 font-sans">
              <Link href="/admin/audit" className="rounded-full border border-[#26364f] px-3 py-1 text-[11px] font-[800] text-white hover:bg-white/10">
                Audit logs
              </Link>
              <Link href="/admin/ai" className="rounded-full border border-[#26364f] px-3 py-1 text-[11px] font-[800] text-white hover:bg-white/10">
                AI review
              </Link>
            </div>
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
          <AdminFoldout title="Platform snapshot" eyebrow="Overview" defaultOpen>
            <section className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6" aria-label="Admin metrics">
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
          </AdminFoldout>

          {/* ── Platform Analytics ──────────────────────────────── */}
          <AdminFoldout title="Platform analytics" eyebrow="Analytics" defaultOpen>
          <section className="grid gap-6 p-5 lg:grid-cols-2">
            {/* AI content index */}
            <div className="pr-card overflow-hidden">
              <div className="border-b border-[var(--border)] p-5">
                <p className="pr-eyebrow">Content AI</p>
                <h2 className="pr-h2 mt-1">AI lesson index</h2>
                <p className="mt-1 text-[13px] text-[var(--muted)]">Builds the semantic search index used by the AI chatbox on lesson pages. Run this after adding or editing lesson content.</p>
              </div>
              <div className="p-5">
                <ReindexButton />
              </div>
            </div>

            {/* DAU / WAU / Totals */}
            <div className="pr-card overflow-hidden">
              <div className="border-b border-[var(--border)] p-5">
                <p className="pr-eyebrow">Engagement</p>
                <h2 className="pr-h2 mt-1">Active users</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[var(--border)] divide-y sm:grid-cols-4 sm:divide-y-0">
                {[
                  { label: "DAU (today)", value: dau, tone: "text-[var(--brand)]" },
                  { label: "WAU (7 days)", value: wau, tone: "text-[var(--success)]" },
                  { label: "Total users", value: totalUsers, tone: "text-[var(--ink)]" },
                  { label: "Enrollments", value: totalEnrollments, tone: "text-[var(--ink)]" }
                ].map((stat) => (
                  <div key={stat.label} className="p-5">
                    <p className={`text-[26px] font-[800] leading-none tracking-[-0.4px] ${stat.tone}`}>
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="mt-2 text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent signups */}
            <div className="pr-card overflow-hidden">
              <div className="border-b border-[var(--border)] p-5">
                <p className="pr-eyebrow">Growth</p>
                <h2 className="pr-h2 mt-1">Recent sign-ups</h2>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {recentSignups.length === 0 ? (
                  <li className="p-5 text-sm font-[700] text-[var(--muted)]">No sign-ups yet.</li>
                ) : recentSignups.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-[800] text-[var(--ink)]">{u.name ?? "Unnamed"}</p>
                      <p className="truncate text-[12px] font-[500] text-[var(--muted)]">{u.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-[800] uppercase tracking-[0.8px] ${roleClass(u.role)}`}>
                        {u.role.toLowerCase()}
                      </span>
                      <p className="mt-1 text-[11px] font-[600] text-[var(--muted)]">
                        {u.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top courses */}
            <div className="pr-card overflow-hidden lg:col-span-2">
              <div className="border-b border-[var(--border)] p-5">
                <p className="pr-eyebrow">Engagement</p>
                <h2 className="pr-h2 mt-1">Top courses by enrollment</h2>
              </div>
              {topCourses.length === 0 ? (
                <p className="p-5 text-sm font-[700] text-[var(--muted)]">No published courses yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {topCourses.map((course, i) => (
                    <li key={course.id} className="flex items-center gap-4 px-5 py-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[12px] font-[800] text-[var(--muted)]">
                        {i + 1}
                      </span>
                      <p className="flex-1 truncate text-[13px] font-[800] text-[var(--ink)]">{course.titleEn}</p>
                      <span className="shrink-0 rounded-full bg-[rgba(0,87,255,0.08)] px-3 py-1 text-[12px] font-[800] text-[var(--brand)]">
                        {course._count.enrollments.toLocaleString()} enrolled
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          </AdminFoldout>

          <AdminFoldout
            title="All courses"
            eyebrow="Course inventory"
            badge={(
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                {courses.length} total
              </span>
            )}
          >
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
          </AdminFoldout>

          <AdminFoldout
            title="Courses awaiting review"
            eyebrow="Review queue"
            defaultOpen={pendingCourses.length > 0}
            badge={(
              <span className="rounded-full border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--warning)]">
                {pendingCourses.length} pending
              </span>
            )}
          >

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
                          <span className={`rounded-full border px-3 py-1 text-xs font-[800] uppercase tracking-[1px] ${course.isPaid ? "border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] text-[var(--brand)]" : "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]"}`}>
                            {coursePriceLabel(course)}
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
                          <span className="text-[var(--muted)]"> · {coursePriceLabel(course)} · {course._count.modules} modules · {course._count.enrollments} enrollments</span>
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
          </AdminFoldout>

          {/* ── Educator Access Requests ───────────────────────────── */}
          <AdminFoldout
            title="Access requests"
            eyebrow="Educator access"
            defaultOpen={pendingRequests.length > 0}
            badge={pendingRequests.length > 0 ? (
              <span className="rounded-full border border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.06)] px-3 py-1 text-xs font-[800] uppercase tracking-[1px] text-[#7C3AED]">
                {pendingRequests.length} pending
              </span>
            ) : null}
          >

            {educatorRequests.length === 0 ? (
              <div className="p-6">
                <div className="pr-muted-box text-center font-[800] text-[var(--muted)]">No educator access requests yet.</div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {educatorRequests.map((req) => {
                  const isPending = req.status === EducatorRequestStatus.PENDING;
                  const isApproved = req.status === EducatorRequestStatus.APPROVED;
                  return (
                    <div key={req.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div className="grid gap-2">
                        {/* User + status */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-[800] text-[var(--ink)]">{req.user.name ?? "Unnamed"}</span>
                          <span className="text-[13px] font-[500] text-[var(--muted)]">{req.user.email}</span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-[800] uppercase tracking-[0.8px] ${
                            isPending ? "border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.06)] text-[#7C3AED]"
                            : isApproved ? "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]"
                            : "border-[rgba(220,38,38,0.18)] bg-red-50 text-red-700"
                          }`}>
                            {req.status.toLowerCase()}
                          </span>
                          <span className="text-[11px] text-[var(--muted-2)]">
                            {new Date(req.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="max-w-2xl text-[13px] font-[500] leading-relaxed text-[var(--ink-2)]">{req.message}</p>

                        {/* Admin note if exists */}
                        {req.adminNote && (
                          <p className="text-[12px] font-[600] text-[var(--muted)]">Admin note: {req.adminNote}</p>
                        )}
                      </div>

                      {/* Actions */}
                      {isPending && (
                        <div className="flex flex-col gap-2 lg:min-w-56">
                          <form action={handleApproveEducatorRequest} className="grid gap-2">
                            <input type="hidden" name="requestId" value={req.id} />
                            <button type="submit" className="pr-btn-primary !min-h-9 w-full text-[12px]">
                              ✓ Approve — upgrade to Educator
                            </button>
                          </form>
                          <form action={handleRejectEducatorRequest} className="grid gap-2">
                            <input type="hidden" name="requestId" value={req.id} />
                            <input name="adminNote" placeholder="Reason (shown to user)" className="pr-input text-[12px]" />
                            <button type="submit" className="pr-btn-danger !min-h-9 w-full text-[12px]">
                              ✕ Reject
                            </button>
                          </form>
                        </div>
                      )}

                      {!isPending && (
                        <span className="text-[12px] font-[700] text-[var(--muted)]">
                          {isApproved ? "Account upgraded to Educator" : "Request rejected"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AdminFoldout>

          {/* ── Users & Roles ──────────────────────────────────────── */}
          <AdminFoldout
            title="Users and roles"
            eyebrow="Access control"
            description="Promote educators, protect admin access, issue temporary recovery passwords, and remove test users."
          >
            <div className="border-b border-[var(--border)] bg-white p-5 lg:p-6">
              <form className="flex flex-wrap gap-2" action="/admin">
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
                                <input
                                  type="password"
                                  name="adminPassword"
                                  autoComplete="current-password"
                                  placeholder="Admin password"
                                  className="pr-input mb-1 h-8 text-xs"
                                />
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
                              <input
                                name="adminPassword"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Your admin password"
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
          </AdminFoldout>

          {/* ── Messaging ─────────────────────────────────────────────── */}
          <AdminFoldout
            title="Message users"
            eyebrow="Admin messaging"
            description="Send a direct message to any individual user, or broadcast to all educators or all students at once."
          >
            <div className="p-5 lg:p-6">
              <div className="mb-5 flex justify-end">
                <Link href="/admin/messages" className="pr-btn-ghost shrink-0">
                  Open inbox →
                </Link>
              </div>
              <AdminComposeForm users={users} history={adminMessageHistory} />
            </div>
          </AdminFoldout>

          {/* ── Site videos ───────────────────────────────────────────── */}
          <AdminFoldout
            title="Instruction & demo videos"
            eyebrow="Site content"
            description="Paste a YouTube link for each page placeholder. Leave blank to keep the default placeholder visible."
          >
            <div className="p-5 lg:p-6">
              <AdminSiteVideosForm currentValues={siteVideos} />
            </div>
          </AdminFoldout>

        </div>
      )}
    </main>
  );
}
