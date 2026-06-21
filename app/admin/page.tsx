import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
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
import { ReassignCourseButton } from "@/components/admin/ReassignCourseButton";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminComposeForm, type AdminMessageHistoryItem } from "@/components/admin/AdminComposeForm";
import { AdminSiteVideosForm } from "@/components/admin/AdminSiteVideosForm";
import { ReindexButton } from "@/components/admin/ReindexButton";
import { AdminPromoCodesSection } from "@/components/admin/AdminPromoCodesSection";

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
    authorId: string;
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
  let promoCodes: Array<{ id: string; code: string; discountType: string; discountValue: number; maxUses: number | null; usedCount: number; expiresAt: Date | null; isActive: boolean; courseId: string | null; courseTitle?: string | null }> = [];
  let paidCourses: Array<{ id: string; title: string }> = [];
  let educators: Array<{ id: string; name: string | null; email: string }> = [];
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
          authorId: true,
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

  try {
    const [promoRows, paidCourseRows] = await Promise.all([
      db.promoCode.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, code: true, discountType: true, discountValue: true, maxUses: true, usedCount: true, expiresAt: true, isActive: true, courseId: true, course: { select: { titleEn: true } } }
      }),
      db.course.findMany({
        where: { isPaid: true, status: CourseStatus.PUBLISHED },
        orderBy: { titleEn: "asc" },
        select: { id: true, titleEn: true }
      })
    ]);
    promoCodes = promoRows.map((p) => ({ ...p, courseTitle: p.course?.titleEn ?? null }));
    paidCourses = paidCourseRows.map((c) => ({ id: c.id, title: c.titleEn }));
    educators = await db.user.findMany({
      where: { role: UserRole.EDUCATOR },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    });
  } catch {
    // promo codes unavailable — section will be empty
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

  const navItems = [
    { id: "overview",  label: "Overview",         icon: "M3 13l4-4 4 4 4-4 4 4M3 17l4-4 4 4 4-4 4 4" },
    { id: "review",    label: "Review queue",      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",     badge: reviewCount,            badgeTone: "warning" as const },
    { id: "courses",   label: "All courses",       icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "requests",  label: "Access requests",   icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", badge: pendingRequests.length, badgeTone: "purple" as const },
    { id: "users",     label: "Users & roles",     icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "promo",     label: "Promo codes",       icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
    { id: "messaging", label: "Messaging",         icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { id: "videos",    label: "Site videos",       icon: "M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" },
  ];

  function SectionHeading({ eyebrow, title, badge }: { eyebrow: string; title: string; badge?: React.ReactNode }) {
    return (
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-5 sm:mb-8">
        <div className="min-w-0">
          <p className="text-[11px] font-[800] uppercase tracking-[1.5px] text-[var(--brand)]">{eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-[900] tracking-[-0.4px] text-[var(--ink)]">{title}</h2>
        </div>
        {badge}
      </div>
    );
  }

  function StatCard({ value, label, tone, sublabel }: { value: number | string; label: string; tone: string; sublabel?: string }) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <p className={`text-[32px] font-[900] leading-none tracking-[-1px] ${tone}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="mt-2.5 text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">{label}</p>
        {sublabel && <p className="mt-1 text-[11px] font-[600] text-[var(--muted)]">{sublabel}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-[var(--surface)]">
      <AdminSidebarNav items={navItems} />

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">

        {/* Alert bar */}
        {(reviewCount > 0 || pendingRequests.length > 0) && (
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(217,119,6,0.2)] bg-[rgba(254,243,199,0.96)] px-4 py-3 backdrop-blur-sm dark:border-[rgba(217,119,6,0.15)] dark:bg-[rgba(78,52,5,0.95)] sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--warning)] text-white">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </span>
              <p className="min-w-0 text-[13px] font-[800] leading-5 text-[var(--warning)]">
                {[reviewCount > 0 && `${reviewCount} course${reviewCount > 1 ? "s" : ""} awaiting review`, pendingRequests.length > 0 && `${pendingRequests.length} educator request${pendingRequests.length > 1 ? "s" : ""} pending`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {reviewCount > 0 && <a href="#review" className="rounded-full bg-[var(--warning)] px-3 py-1 text-[11px] font-[900] text-white">Review now →</a>}
              {pendingRequests.length > 0 && <a href="#requests" className="rounded-full border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.08)] px-3 py-1 text-[11px] font-[900] text-[#7C3AED]">View requests →</a>}
            </div>
          </div>
        )}

        {/* DB error */}
        {dbError && (
          <div className="m-6 rounded-[var(--radius-xl)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-8 text-center">
            <p className="text-[15px] font-[800] text-[var(--warning)]">Database unavailable — please refresh in a moment.</p>
          </div>
        )}

        <div className="grid gap-10 px-4 pb-20 pt-6 sm:px-6 lg:gap-16 lg:px-10 lg:pb-24 lg:pt-8">

          {/* ═══════════════════════════════════════════════════════
              OVERVIEW
          ═══════════════════════════════════════════════════════ */}
          <section id="overview">
            <SectionHeading eyebrow="Dashboard" title="Platform overview" />

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard value={publishedCount}          label="Published courses" tone="text-[var(--success)]" />
              <StatCard value={reviewCount}             label="Awaiting review"   tone={reviewCount > 0 ? "text-[var(--warning)]" : "text-[var(--muted)]"} />
              <StatCard value={draftCount}              label="Drafts"            tone="text-[var(--muted)]" />
              <StatCard value={users.length}            label="Total users"       tone="text-[var(--brand)]" />
              <StatCard value={totalEnrollments}        label="Enrollments"       tone="text-[var(--ink)]" />
              <StatCard value={totalSubmissions}        label="Quiz submissions"  tone="text-[var(--ink)]" />
            </div>

            {/* Bottom row */}
            <div className="mt-6 grid gap-5 lg:grid-cols-3">

              {/* DAU / WAU */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
                  <p className="text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">Engagement</p>
                  <p className="mt-1 text-[16px] font-[900] text-[var(--ink)]">Active users</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                  {[{ label: "DAU", value: dau, tone: "text-[var(--brand)]" }, { label: "WAU (7d)", value: wau, tone: "text-[var(--success)]" }].map((s) => (
                    <div key={s.label} className="p-5">
                      <p className={`text-[26px] font-[900] leading-none ${s.tone}`}>{s.value.toLocaleString()}</p>
                      <p className="mt-1.5 text-[10px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <ReindexButton />
                </div>
              </div>

              {/* Recent sign-ups */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  <p className="text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">Growth</p>
                  <p className="mt-1 text-[16px] font-[900] text-[var(--ink)]">Recent sign-ups</p>
                </div>
                <ul className="divide-y divide-[var(--border)]">
                  {recentSignups.length === 0 ? (
                    <li className="px-5 py-4 text-[13px] font-[700] text-[var(--muted)]">No sign-ups yet.</li>
                  ) : recentSignups.slice(0, 6).map((u) => {
                    const initials = (u.name ?? u.email).split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
                    const hue = u.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
                    return (
                      <li key={u.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-[900] text-white" style={{ background: `hsl(${hue},55%,45%)` }}>{initials}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-[800] text-[var(--ink)]">{u.name ?? "Unnamed"}</p>
                          <p className="truncate text-[11px] font-[500] text-[var(--muted)]">{u.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-[900] uppercase tracking-[0.8px] ${roleClass(u.role)}`}>{u.role.toLowerCase()}</span>
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">{u.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Top courses */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  <p className="text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">Popularity</p>
                  <p className="mt-1 text-[16px] font-[900] text-[var(--ink)]">Top courses</p>
                </div>
                {topCourses.length === 0 ? (
                  <p className="px-5 py-4 text-[13px] font-[700] text-[var(--muted)]">No published courses yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {topCourses.map((course, i) => {
                      const maxEnr = topCourses[0]._count.enrollments || 1;
                      const pct = Math.round((course._count.enrollments / maxEnr) * 100);
                      return (
                        <li key={course.id} className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[11px] font-[900] text-[var(--muted)]">{i + 1}</span>
                            <p className="flex-1 truncate text-[13px] font-[800] text-[var(--ink)]">{course.titleEn}</p>
                            <span className="shrink-0 text-[12px] font-[800] text-[var(--brand)]">{course._count.enrollments}</span>
                          </div>
                          <div className="mt-2 ml-9 h-1 rounded-full bg-[var(--surface)]">
                            <div className="h-1 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              REVIEW QUEUE
          ═══════════════════════════════════════════════════════ */}
          <section id="review">
            <SectionHeading
              eyebrow="Content moderation"
              title="Review queue"
              badge={
                <span className={`rounded-full border px-3 py-1 text-[12px] font-[900] ${reviewCount > 0 ? "border-[rgba(150,96,0,0.25)] bg-[var(--warning-50)] text-[var(--warning)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"}`}>
                  {reviewCount} pending
                </span>
              }
            />

            {pendingCourses.length === 0 ? (
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] px-8 py-14 text-center shadow-[var(--shadow-sm)]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--success-50)] text-[var(--success)]">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="mt-4 text-[15px] font-[800] text-[var(--ink-2)]">Queue is clear</p>
                <p className="mt-1 text-[13px] font-[600] text-[var(--muted)]">No courses are waiting for review.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {pendingCourses.map((course) => (
                  <article key={course.id} className="overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(150,96,0,0.25)] bg-[var(--card)] shadow-[var(--shadow)]">
                    {/* Urgency top strip */}
                    <div className="h-1 bg-gradient-to-r from-[var(--warning)] to-[#f59e0b]" />

                    <div className="p-6">
                      <div className="flex flex-wrap items-start gap-4 lg:flex-nowrap">
                        {/* Course info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] ${statusClass(course.status)}`}>{statusLabel(course.status)}</span>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] ${course.isPaid ? "border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] text-[var(--brand)]" : "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]"}`}>{coursePriceLabel(course)}</span>
                            <span className="text-[11px] font-[700] text-[var(--muted)]">{course.slug}</span>
                          </div>
                          <h3 className="mt-3 text-[20px] font-[900] tracking-[-0.3px] text-[var(--ink)]">{course.titleEn}</h3>
                          <p className="mt-1.5 text-[13px] font-[500] leading-6 text-[var(--muted)] line-clamp-2">{course.descriptionEn}</p>
                          <p className="mt-3 text-[13px] font-[700] text-[var(--ink-2)]">
                            {course.author.name || course.author.email}
                            <span className="font-[500] text-[var(--muted)]"> · {course._count.modules} modules · {course._count.enrollments} enrollments</span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 flex-col gap-2 lg:min-w-48">
                          <form action={handlePublish}>
                            <input type="hidden" name="courseId" value={course.id} />
                            <button type="submit" className="w-full rounded-[var(--radius-lg)] bg-[var(--success)] px-5 py-2.5 text-[13px] font-[900] text-white transition hover:bg-[#126b4b]">
                              ✓ Publish
                            </button>
                          </form>
                          <details className="rounded-[var(--radius-lg)] border border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.04)]">
                            <summary className="cursor-pointer list-none px-4 py-2.5 text-[13px] font-[800] text-[#dc2626]">✕ Return to educator</summary>
                            <form action={handleReject} className="grid gap-2 border-t border-[rgba(220,38,38,0.15)] p-3">
                              <input type="hidden" name="courseId" value={course.id} />
                              <textarea name="reviewNote" required minLength={5} placeholder="Reason for return (shown to educator)" className="pr-input min-h-20 text-[13px]" />
                              <button type="submit" className="pr-btn-danger !min-h-9 text-[12px]">Send note</button>
                            </form>
                          </details>
                        </div>
                      </div>

                      {/* Review panels */}
                      <div className="mt-5 grid gap-3">
                        <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                          <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-[800] text-[var(--brand)]">Review course content</summary>
                          <div className="grid gap-4 border-t border-[var(--border)] p-4">
                            {course.modules.length === 0 ? (
                              <div className="rounded-[var(--radius)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-4 py-3 text-[13px] font-[800] text-[var(--warning)]">No modules — return to draft before publishing.</div>
                            ) : course.modules.map((module) => (
                              <section key={module.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-[800] uppercase tracking-[1.5px] text-[var(--muted)]">Module {module.order}</p>
                                    <h4 className="mt-1 text-[15px] font-[800] text-[var(--ink)]">{module.titleEn}</h4>
                                    {module.descriptionEn ? <p className="mt-1 text-[13px] font-[500] leading-5 text-[var(--muted)]">{module.descriptionEn}</p> : null}
                                  </div>
                                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-[800] text-[var(--muted)]">{module.lessons.length} lessons</span>
                                </div>
                                {module.lessons.length === 0 ? (
                                  <p className="mt-3 rounded-[var(--radius)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-4 py-3 text-[13px] font-[800] text-[var(--warning)]">This module has no lessons.</p>
                                ) : (
                                  <div className="mt-3 grid gap-2">
                                    {module.lessons.map((lesson) => (
                                      <article key={lesson.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="rounded-full border border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] px-2 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] text-[var(--brand)]">{lesson.type}</span>
                                          <span className="text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">Lesson {lesson.order}</span>
                                          {lesson.isFinalTest ? <span className="rounded-full border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] px-2 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] text-[var(--warning)]">Final test · {lesson.passingScore ?? 80}%</span> : null}
                                        </div>
                                        <h5 className="mt-1.5 text-[13px] font-[800] text-[var(--ink)]">{lesson.titleEn}</h5>
                                        {lesson.type === LessonType.VIDEO ? <p className="mt-1 break-all text-[12px] font-[700] text-[var(--brand)]">{lesson.youtubeUrl ?? "Missing YouTube URL"}</p> : null}
                                        {lesson.type === LessonType.READING && lesson.readingEn ? <p className="mt-1 line-clamp-2 text-[12px] font-[500] text-[var(--muted)]">{lesson.readingEn}</p> : null}
                                        {lesson.type === LessonType.QUIZ ? (
                                          <div className="mt-1.5 grid gap-1.5">
                                            <p className="text-[12px] font-[700] text-[var(--muted)]">{lesson.quiz?.questions.length ?? 0} questions</p>
                                            {lesson.quiz?.questions.slice(0, 3).map((q) => (
                                              <div key={q.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                                                <p className="text-[10px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">{q.type === QuestionType.TEXT_INPUT ? "Text / math" : q.type === QuestionType.MULTIPLE_CHOICE ? "Multiple choice" : "Single choice"}</p>
                                                <p className="mt-0.5 text-[12px] font-[700] text-[var(--ink-2)]">{q.promptEn}</p>
                                                {q.type === QuestionType.TEXT_INPUT ? <p className="mt-0.5 text-[11px] font-[800] text-[var(--brand)]">Answer: {q.correctAnswer ?? "Missing"}</p> : <p className="mt-0.5 text-[11px] font-[800] text-[var(--brand)]">{q.choices.filter((c) => c.isCorrect).length} correct choice(s)</p>}
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}
                                      </article>
                                    ))}
                                  </div>
                                )}
                              </section>
                            ))}
                          </div>
                        </details>

                        {course.reviewEvents.length > 0 && (
                          <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                            <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-[800] text-[var(--brand)]">Review history ({course.reviewEvents.length})</summary>
                            <div className="grid gap-2 border-t border-[var(--border)] p-4">
                              {course.reviewEvents.map((event) => (
                                <div key={event.id} className="rounded-[var(--radius)] bg-[var(--card)] p-3">
                                  <p className="text-[10px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">{event.type} · {event.createdAt.toLocaleString()} · {event.actor.name ?? event.actor.email}</p>
                                  {event.note ? <p className="mt-1 text-[13px] font-[600] text-[var(--ink-2)]">{event.note}</p> : null}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                          <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-[800] text-[var(--brand)]">Review checklist</summary>
                          <div className="grid gap-3 border-t border-[var(--border)] p-4">
                            {["Clear learning outcome", "Complete lesson content", "Quiz answers verified", "Bilingual student content", "No broken links"].map((label) => {
                              const item = course.reviewChecklistItems.find((e) => e.label === label);
                              return (
                                <form key={label} action={handleSaveChecklistItem} className="grid gap-2 rounded-[var(--radius)] bg-[var(--card)] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                                  <input type="hidden" name="courseId" value={course.id} />
                                  <input type="hidden" name="label" value={label} />
                                  <label className="flex items-center gap-2 text-[13px] font-[800] text-[var(--ink-2)]">
                                    <input name="passed" type="checkbox" defaultChecked={item?.passed ?? false} className="h-4 w-4" />
                                    {label}
                                  </label>
                                  <input name="note" defaultValue={item?.note ?? ""} placeholder="Optional note" className="pr-input text-[13px] sm:min-w-56" />
                                  <button type="submit" className="pr-btn-secondary !min-h-9 text-[12px] sm:col-span-2">Save</button>
                                </form>
                              );
                            })}
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════
              ALL COURSES
          ═══════════════════════════════════════════════════════ */}
          <section id="courses">
            <SectionHeading
              eyebrow="Course inventory"
              title="All courses"
              badge={
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-[900] text-[var(--muted)]">
                  {courses.length} total · {publishedCount} live · {draftCount} draft
                </span>
              }
            />

            {courses.length === 0 ? (
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] px-8 py-12 text-center">
                <p className="text-[14px] font-[800] text-[var(--muted)]">No courses yet.</p>
              </div>
            ) : (
              <>
              <div className="hidden overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">
                        <th className="px-5 py-3">Course</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Author</th>
                        <th className="px-5 py-3">Stats</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {courses.map((course) => (
                        <tr key={course.id} className="group transition hover:bg-[var(--surface)]">
                          <td className="px-5 py-4 max-w-xs">
                            <p className="text-[13px] font-[800] text-[var(--ink)]">{course.titleEn}</p>
                            <p className="mt-0.5 line-clamp-1 text-[12px] font-[500] text-[var(--muted)]">{course.descriptionEn}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] ${statusClass(course.status)}`}>{statusLabel(course.status)}</span>
                          </td>
                          <td className="px-5 py-4 text-[13px] font-[700] text-[var(--ink-2)]">{course.author.name ?? course.author.email}</td>
                          <td className="px-5 py-4 text-[12px] font-[600] text-[var(--muted)]">{course._count.modules}m · {course._count.enrollments} enrolled</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <ReassignCourseButton courseId={course.id} courseTitle={course.titleEn} currentAuthorId={course.authorId} educators={educators} />
                              <DeleteCourseButton courseId={course.id} label={course.titleEn} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid gap-3 md:hidden">
                {courses.map((course) => (
                  <article key={course.id} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-[900] leading-snug text-[var(--ink)]">{course.titleEn}</p>
                        <p className="mt-1 line-clamp-2 text-[12px] font-[500] leading-5 text-[var(--muted)]">{course.descriptionEn}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-[900] uppercase tracking-[0.8px] ${statusClass(course.status)}`}>{statusLabel(course.status)}</span>
                    </div>
                    <div className="mt-3 grid gap-1.5 text-[12px] font-[700] text-[var(--muted)]">
                      <p><span className="text-[var(--ink-2)]">Author:</span> {course.author.name ?? course.author.email}</p>
                      <p><span className="text-[var(--ink-2)]">Stats:</span> {course._count.modules} modules · {course._count.enrollments} enrolled</p>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <ReassignCourseButton courseId={course.id} courseTitle={course.titleEn} currentAuthorId={course.authorId} educators={educators} />
                      <DeleteCourseButton courseId={course.id} label={course.titleEn} />
                    </div>
                  </article>
                ))}
              </div>
              </>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════
              ACCESS REQUESTS
          ═══════════════════════════════════════════════════════ */}
          <section id="requests">
            <SectionHeading
              eyebrow="Educator access"
              title="Access requests"
              badge={pendingRequests.length > 0 ? (
                <span className="rounded-full border border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.06)] px-3 py-1 text-[12px] font-[900] text-[#7C3AED]">{pendingRequests.length} pending</span>
              ) : undefined}
            />

            {educatorRequests.length === 0 ? (
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] px-8 py-12 text-center">
                <p className="text-[14px] font-[800] text-[var(--muted)]">No educator access requests yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {educatorRequests.map((req) => {
                  const isPending = req.status === EducatorRequestStatus.PENDING;
                  const isApproved = req.status === EducatorRequestStatus.APPROVED;
                  return (
                    <div key={req.id} className={`overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--card)] shadow-[var(--shadow-sm)] ${isPending ? "border-[rgba(124,58,237,0.25)]" : "border-[var(--border)]"}`}>
                      {isPending && <div className="h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#a78bfa]" />}
                      <div className="p-5 lg:grid lg:grid-cols-[1fr_auto] lg:items-start lg:gap-6">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-[900] text-[var(--ink)]">{req.user.name ?? "Unnamed"}</span>
                            <span className="text-[13px] font-[500] text-[var(--muted)]">{req.user.email}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-[900] uppercase tracking-[0.8px] ${isPending ? "border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.06)] text-[#7C3AED]" : isApproved ? "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]" : "border-[rgba(220,38,38,0.18)] bg-red-50 text-red-700"}`}>{req.status.toLowerCase()}</span>
                            <span className="text-[11px] text-[var(--muted-2)]">{new Date(req.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                          </div>
                          <p className="mt-2 max-w-2xl text-[13px] font-[500] leading-relaxed text-[var(--ink-2)]">{req.message}</p>
                          {req.adminNote && <p className="mt-1.5 text-[12px] font-[600] text-[var(--muted)]">Admin note: {req.adminNote}</p>}
                        </div>
                        {isPending ? (
                          <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:min-w-52">
                            <form action={handleApproveEducatorRequest}>
                              <input type="hidden" name="requestId" value={req.id} />
                              <button type="submit" className="w-full rounded-[var(--radius-lg)] bg-[#7C3AED] px-4 py-2.5 text-[12px] font-[900] text-white transition hover:bg-[#6d28d9]">✓ Approve — upgrade to Educator</button>
                            </form>
                            <form action={handleRejectEducatorRequest} className="grid gap-1.5">
                              <input type="hidden" name="requestId" value={req.id} />
                              <input name="adminNote" placeholder="Reason (shown to user)" className="pr-input text-[12px]" />
                              <button type="submit" className="pr-btn-danger !min-h-9 text-[12px]">✕ Reject</button>
                            </form>
                          </div>
                        ) : (
                          <p className="mt-2 text-[12px] font-[700] text-[var(--muted)] lg:mt-0">{isApproved ? "Upgraded to Educator" : "Request rejected"}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════
              USERS & ROLES
          ═══════════════════════════════════════════════════════ */}
          <section id="users">
            <SectionHeading eyebrow="Access control" title="Users & roles" />

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <form className="flex w-full flex-wrap gap-2 sm:w-auto" action="/admin">
                <select name="role" defaultValue={roleFilter} className="pr-input max-w-48 text-[13px]">
                  <option value="">All roles</option>
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{roleLabel(role)}</option>
                  ))}
                </select>
                <button type="submit" className="pr-btn-secondary !min-h-10 px-4 text-[13px]">Filter</button>
              </form>
              <span className="text-[12px] font-[700] text-[var(--muted)]">{users.length} users</span>
            </div>

            {users.length === 0 ? (
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] px-8 py-12 text-center">
                <p className="text-[14px] font-[800] text-[var(--muted)]">No users found.</p>
              </div>
            ) : (
              <>
              <div className="hidden overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">
                        <th className="px-5 py-3">User</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Change role</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {users.map((user) => {
                        const initials = (user.name ?? user.email).split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
                        const hue = user.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
                        return (
                          <tr key={user.id} className="group transition hover:bg-[var(--surface)]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-[900] text-white" style={{ background: `hsl(${hue},50%,42%)` }}>{initials}</span>
                                <div>
                                  <p className="text-[13px] font-[800] text-[var(--ink)]">{user.name ?? "Unnamed user"}</p>
                                  <p className="text-[12px] font-[500] text-[var(--muted)]">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] ${roleClass(user.role)}`}>{roleLabel(user.role)}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                {Object.values(UserRole).map((roleOption) => (
                                  <form key={roleOption} action={handleUpdateUserRole}>
                                    <input type="hidden" name="userId" value={user.id} />
                                    <input type="hidden" name="role" value={roleOption} />
                                    <input type="password" name="adminPassword" autoComplete="current-password" placeholder="Admin pw" className="pr-input mb-1 h-8 text-[12px]" />
                                    <button type="submit" disabled={roleOption === user.role} className={`h-8 min-w-20 rounded-[var(--radius)] px-3 text-[11px] font-[800] transition ${roleOption === user.role ? "cursor-not-allowed border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" : "border border-[var(--border)] bg-[var(--card)] text-[var(--ink)] hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--brand)]"}`}>
                                      {roleLabel(roleOption)}
                                    </button>
                                  </form>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <details className="group/pw ms-auto w-64 max-w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                                <summary className="cursor-pointer list-none px-4 py-2 text-right text-[12px] font-[800] uppercase tracking-[1px] text-[var(--brand)]">Reset password</summary>
                                <form action={handleResetUserPassword} className="grid gap-2 border-t border-[var(--border)] p-3">
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input id={`pw-${user.id}`} name="password" type="text" minLength={8} placeholder="Temporary password" className="pr-input text-[13px]" />
                                  <input name="adminPassword" type="password" autoComplete="current-password" placeholder="Your admin password" className="pr-input text-[13px]" />
                                  <button type="submit" className="pr-btn-secondary !min-h-9 text-[12px]">Save temporary password</button>
                                </form>
                              </details>
                              <div className="mt-2 text-right">
                                <DeleteUserButton userId={user.id} label={user.email} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid gap-3 md:hidden">
                {users.map((user) => {
                  const initials = (user.name ?? user.email).split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
                  const hue = user.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
                  return (
                    <article key={user.id} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-[900] text-white" style={{ background: `hsl(${hue},50%,42%)` }}>{initials}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-[900] text-[var(--ink)]">{user.name ?? "Unnamed user"}</p>
                          <p className="text-[12px] font-[600] text-[var(--muted)]">{user.email}</p>
                          <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] ${roleClass(user.role)}`}>{roleLabel(user.role)}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-[11px] font-[900] uppercase tracking-[1px] text-[var(--muted)]">Change role</p>
                          <div className="grid gap-2">
                            {Object.values(UserRole).map((roleOption) => (
                              <form key={roleOption} action={handleUpdateUserRole} className="grid gap-1.5">
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="role" value={roleOption} />
                                <input type="password" name="adminPassword" autoComplete="current-password" placeholder="Admin pw" className="pr-input h-9 text-[12px]" />
                                <button type="submit" disabled={roleOption === user.role} className={`min-h-9 rounded-[var(--radius)] px-3 text-[12px] font-[800] transition ${roleOption === user.role ? "cursor-not-allowed border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]" : "border border-[var(--border)] bg-[var(--card)] text-[var(--ink)] hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--brand)]"}`}>
                                  {roleLabel(roleOption)}
                                </button>
                              </form>
                            ))}
                          </div>
                        </div>
                        <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                          <summary className="cursor-pointer list-none px-4 py-2 text-[12px] font-[900] uppercase tracking-[1px] text-[var(--brand)]">Reset password</summary>
                          <form action={handleResetUserPassword} className="grid gap-2 border-t border-[var(--border)] p-3">
                            <input type="hidden" name="userId" value={user.id} />
                            <input name="password" type="text" minLength={8} placeholder="Temporary password" className="pr-input text-[13px]" />
                            <input name="adminPassword" type="password" autoComplete="current-password" placeholder="Your admin password" className="pr-input text-[13px]" />
                            <button type="submit" className="pr-btn-secondary !min-h-9 text-[12px]">Save temporary password</button>
                          </form>
                        </details>
                        <DeleteUserButton userId={user.id} label={user.email} />
                      </div>
                    </article>
                  );
                })}
              </div>
              </>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════
              PROMO CODES
          ═══════════════════════════════════════════════════════ */}
          <section id="promo">
            <SectionHeading eyebrow="Discounts" title="Promo codes" />
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <AdminPromoCodesSection promoCodes={promoCodes} paidCourses={paidCourses} />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              MESSAGING
          ═══════════════════════════════════════════════════════ */}
          <section id="messaging">
            <SectionHeading
              eyebrow="Admin messaging"
              title="Message users"
              badge={
                <Link href="/admin/messages" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-[800] text-[var(--ink-2)] transition hover:text-[var(--brand)]">
                  Open inbox →
                </Link>
              }
            />
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]">
              <AdminComposeForm users={users} history={adminMessageHistory} />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              SITE VIDEOS
          ═══════════════════════════════════════════════════════ */}
          <section id="videos">
            <SectionHeading eyebrow="Site content" title="Instruction & demo videos" />
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]">
              <AdminSiteVideosForm currentValues={siteVideos} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
