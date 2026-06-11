"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CourseStatus } from "@prisma/client";
import { CourseSubmitButton } from "@/components/educator/CourseSubmitButton";
import { DeleteCourseButton } from "@/components/educator/DeleteCourseButton";
import { NewCourseModal } from "@/components/educator/NewCourseModal";
import { MessagesInbox } from "@/components/MessagesInbox";
import { postCourseAnnouncement } from "@/lib/actions/announcement-actions";
import { PortalSettingsView } from "@/components/PortalSettingsView";
import { useLanguage } from "@/components/LanguageProvider";
import { RecommendedCourses } from "@/components/RecommendedCourses";
import type { Dictionary } from "@/lib/i18n";
import type { RecommendedCourse } from "@/lib/recommendations";

export type StudentJourney = {
  certificates: Array<{
    certificateUuid: string;
    courseId: string;
    courseTitle: string;
    grade: number;
    issuedAt: string;
  }>;
  enrollments: Array<{
    courseId: string;
    courseSlug: string;
    courseTitle: string;
    enrolledAt: string;
    totalLessons: number;
    completedLessons: number;
    hasCertificate: boolean;
  }>;
};

type CreatorCourse = {
  id: string;
  slug: string;
  status: CourseStatus;
  title: string;
  description: string;
  modules: number;
  enrollments: number;
  updatedAt: string;
  reviewNote: string | null;
  latestReview: "SUBMITTED" | "PUBLISHED" | "RETURNED" | null;
  qualityScore: number;
  qualityIssues: string[];
};

type CreatorDashboardViewProps = {
  firstName: string;
  intro: string;
  courses: CreatorCourse[];
  students: string[];
  metrics: {
    enrollments: number;
    activeCourses: number;
    averageRating: number | null;
    ratingCount: number;
    unreadMessages: number;
    completedCertificates: number;
    completionRate: number;
  };
  profile: {
    name: string;
    email: string;
    bio: string;
    image: string | null;
    linkedinUrl: string | null;
  };
  studentJourney: StudentJourney;
  analyticsData: Array<{
    id: string;
    title: string;
    totalEnrollments: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      moduleTitle: string;
      completedCount: number;
      completionRate: number;
    }>;
  }>;
  recommendedCourses: RecommendedCourse[];
  sessions: Array<{
    id: string;
    label: string;
    expires: string;
    current?: boolean;
  }>;
};

type CreatorView = "dashboard" | "creator" | "submissions" | "students" | "messages" | "analytics" | "announce" | "resources" | "journey" | "settings";

function statusLabel(status: CourseStatus, latestReview: CreatorCourse["latestReview"], t: Dictionary) {
  if (latestReview === "RETURNED") return t.statusRejected;
  if (status === CourseStatus.PUBLISHED) return t.statusApproved;
  if (status === CourseStatus.PENDING_REVIEW) return t.inReview;
  return t.statusDraft;
}

function statusBadgeClass(status: CourseStatus, latestReview: CreatorCourse["latestReview"]) {
  if (latestReview === "RETURNED") return "bg-[var(--danger-50)] text-[var(--danger)]";
  if (status === CourseStatus.PUBLISHED) return "bg-[var(--success-50)] text-[var(--success)]";
  if (status === CourseStatus.PENDING_REVIEW) return "bg-[var(--warning-50)] text-[var(--warning)]";
  return "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
}

function readiness(status: CourseStatus) {
  if (status === CourseStatus.PUBLISHED) return 100;
  if (status === CourseStatus.PENDING_REVIEW) return 80;
  return 40;
}

function readinessHint(status: CourseStatus, t: Dictionary) {
  if (status === CourseStatus.PUBLISHED) return t.readinessHintPublished;
  if (status === CourseStatus.PENDING_REVIEW) return t.readinessHintSubmitted;
  return t.readinessHintDraft;
}

function NavIcon({ name }: { name: CreatorView }) {
  const paths: Record<CreatorView, string> = {
    dashboard: "M4 6.5 12 3l8 3.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z M9 20v-6h6v6",
    creator: "M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z M12 9v6M9 12h6",
    submissions: "M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z M14 3.5V8h4M8.5 13h7M8.5 16h5",
    students: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5 M15.5 6.2A2.8 2.8 0 0 1 17 11.5 M16.5 14c2.2.4 3.5 2 3.5 4.5",
    messages: "M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4 3v-3H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z",
    analytics: "M3 20h18M7 20V14M11 20V8M15 20V4M19 20v-8",
    announce: "M3 8.5h2.5m-2 5h2m3-8.5h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8.5l-3 3V7a2 2 0 0 1 2-2Z",
    resources: "M5 4h14v14.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 18.5V4Z M8 8h8M8 12h8M8 16h5",
    journey: "M2 9.5L12 5l10 4.5-10 4.5L2 9.5Z M6 12v4.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5V12 M20 9.5v5",
    settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2.1-1.5Z"
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricIcon({ name }: { name: "enrollments" | "courses" | "rating" | "messages" }) {
  if (name === "rating") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 17.77 6.2 20.5l.99-5.79-4.21-4.1 5.82-.85L12 3.5z" />
      </svg>
    );
  }
  const paths: Record<string, string> = {
    enrollments: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5 M15.5 6.2A2.8 2.8 0 0 1 17 11.5 M16.5 14c2.2.4 3.5 2 3.5 4.5",
    courses: "M5 4.5C7.5 3.6 10.5 4 12 5.5v13C10.5 17 7.5 16.6 5 17.5v-13Z M12 5.5C13.5 4 16.5 3.6 19 4.5v13c-2.5-.9-5.5-.5-7 1v-13Z",
    messages: "M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4 3v-3H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z"
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressDonut({ percent }: { percent: number }) {
  const size = 140;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${percent}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#C9A84C"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute text-[30px] font-[900] tracking-[-1px] text-[var(--ink)]">{percent}%</span>
    </div>
  );
}

function CourseRow({ course, t }: { course: CreatorCourse; t: Dictionary }) {
  return (
    <article className="flex overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow)]">
      <div className="flex flex-1 flex-wrap items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-[800] uppercase tracking-[1px] ${statusBadgeClass(course.status, course.latestReview)}`}>
              {statusLabel(course.status, course.latestReview, t)}
            </span>
            <span className="text-[12px] font-[600] text-[var(--muted-2)]">{course.slug}</span>
          </div>
          <h3 className="mt-2 text-[16px] font-[800] tracking-tight text-[var(--ink)]">{course.title}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">{course.description}</p>
          <p className="mt-2 text-[12px] font-[700] text-[var(--muted-2)]">
            {course.modules} {t.modulesCount} · {course.enrollments} {t.studentsCount}
          </p>
          <div className="mt-3 grid gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-[900] uppercase tracking-[1px] text-[var(--muted)]">Quality</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-[900] ${course.qualityScore >= 90 ? "bg-[var(--success-50)] text-[var(--success)]" : course.qualityScore >= 70 ? "bg-[var(--warning-50)] text-[var(--warning)]" : "bg-[var(--danger-50)] text-[var(--danger)]"}`}>
                {course.qualityScore}%
              </span>
            </div>
            {course.qualityIssues.length > 0 ? (
              <p className="line-clamp-1 text-[11px] font-[700] text-[var(--muted)]">{course.qualityIssues.slice(0, 2).join(" · ")}</p>
            ) : (
              <p className="text-[11px] font-[700] text-[var(--success)]">Trilingual content looks complete.</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/educator/courses/${course.id}`} className="pr-btn-primary !min-h-9 px-4 text-[13px]">
            {t.editCourse}
          </Link>
          {course.status === CourseStatus.DRAFT ? <CourseSubmitButton courseId={course.id} /> : null}
          <DeleteCourseButton courseId={course.id} />
        </div>
      </div>
    </article>
  );
}

type AnnounceViewCourse = { id: string; title: string; enrollments: number };

function AnnounceView({ courses, t }: { courses: AnnounceViewCourse[]; t: Dictionary }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const publishedCourses = courses.filter((c) => c.enrollments > 0);

  async function handleSend() {
    if (!body.trim() || !courseId) return;
    setStatus("sending");
    const result = await postCourseAnnouncement({ courseId, body });
    setStatus(result.ok ? "sent" : "error");
    if (result.ok) setBody("");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <section className="grid gap-5">
      <div className="pr-panel p-6 lg:p-8">
        <p className="pr-eyebrow">{t.announceNavLabel}</p>
        <h1 className="pr-h2 mt-1">{t.announcePageTitle}</h1>
        <p className="pr-copy mt-2 max-w-2xl">{t.announcePageDesc}</p>
      </div>

      <div className="pr-panel p-6 lg:p-8">
        {publishedCourses.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t.announceNoCourses}</p>
        ) : (
          <div className="grid gap-5">
            <div>
              <label className="mb-1.5 block text-[12px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                {t.analyticsCourseLabel}
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="pr-input w-full max-w-sm py-2.5 text-[13px]"
              >
                {publishedCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} · {c.enrollments} {t.analyticsStudentsSuffix}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                {t.announceMessageLabel}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={t.announceMessagePlaceholder}
                className="pr-input w-full resize-none py-3 text-[14px]"
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">{body.length}/1000</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSend}
                disabled={status === "sending" || body.trim().length < 10}
                className="pr-btn-primary disabled:opacity-50"
              >
                {status === "sending" ? t.announceSending : t.announceSend}
              </button>
              {status === "sent" && <span className="text-[13px] font-[700] text-[var(--success)]">{t.announceSent}</span>}
              {status === "error" && <span className="text-[13px] font-[700] text-[var(--danger)]">{t.announceError}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function CreatorDashboardView({
  firstName,
  intro,
  courses,
  students,
  metrics,
  profile,
  studentJourney,
  analyticsData,
  recommendedCourses,
  sessions
}: CreatorDashboardViewProps) {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<CreatorView>("dashboard");
  const [journeyTab, setJourneyTab] = useState<"certificates" | "courses">("certificates");
  const [analyticsCourseId, setAnalyticsCourseId] = useState<string>(analyticsData[0]?.id ?? "");
  const latestCourse = courses[0] ?? null;
  const editableCourses = useMemo(
    () => courses.filter((course) => course.status === CourseStatus.DRAFT || course.status === CourseStatus.PUBLISHED),
    [courses]
  );
  const submittedCourses = useMemo(
    () => courses.filter((course) => course.status === CourseStatus.PENDING_REVIEW || course.status === CourseStatus.PUBLISHED || course.latestReview === "RETURNED"),
    [courses]
  );

  const heroMetrics = [
    { key: "enrollments", label: t.metricStudentEnrollments, value: metrics.enrollments.toLocaleString(), icon: "enrollments" as const, showStars: false },
    { key: "courses", label: t.metricActiveCourses, value: metrics.activeCourses.toLocaleString(), icon: "courses" as const, showStars: false },
    { key: "rating", label: t.metricAverageRating, value: metrics.ratingCount ? metrics.averageRating?.toFixed(1) ?? "—" : "—", icon: "rating" as const, showStars: metrics.ratingCount > 0 },
    { key: "messages", label: t.metricStudentMessages, value: metrics.unreadMessages.toLocaleString(), icon: "messages" as const, showStars: false },
  ];

  const navItems: Array<{ key: CreatorView; label: string; icon: CreatorView }> = [
    { key: "dashboard", label: t.dashboard, icon: "dashboard" },
    { key: "creator", label: t.navCourseCreator, icon: "creator" },
    { key: "submissions", label: t.navMySubmissions, icon: "submissions" },
    { key: "students", label: t.navMyStudents, icon: "students" },
    { key: "messages", label: t.messagesTitle, icon: "messages" },
    { key: "analytics", label: t.analyticsNavLabel, icon: "analytics" },
    { key: "announce", label: t.announceNavLabel, icon: "announce" },
    { key: "resources", label: t.navResources, icon: "resources" },
    { key: "journey", label: t.navMyStudentJourney, icon: "journey" },
    { key: "settings", label: t.navCreatorSettings, icon: "settings" }
  ];

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "resources") setActiveView("resources");
  }, []);

  return (
    <main className="pr-page">
      <div className="student-portal-shell">
        <aside className="student-portal-sidebar" aria-label={t.creatorPortal}>
          <div className="student-portal-brand">
            <span className="student-portal-brand-icon">
              {/* Graduation cap — educator */}
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)", display: "block" }}>{t.creatorPortal}</span>
            </div>
          </div>
          <nav className="student-portal-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
                className={`student-portal-nav-link ${activeView === item.key ? "is-active" : ""}`}
                aria-current={activeView === item.key ? "page" : undefined}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="student-portal-content grid gap-6">
          {activeView === "dashboard" ? (
            <>
              <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(120deg,#3A1D7A_0%,#4F2BA8_45%,#5B3FC4_100%)] px-6 pb-24 pt-7 text-white shadow-[var(--shadow-lg)] lg:px-10 lg:pb-28 lg:pt-9">
                <p className="text-[11px] font-[800] uppercase tracking-[3px] text-white/70">{t.creatorPortal}</p>
                <h1 className="mt-2 text-[clamp(28px,4vw,44px)] font-[800] leading-tight tracking-tight">
                  {t.welcomeBack}, {firstName}! 👋
                </h1>
                <p className="mt-2 max-w-xl text-[15px] font-[500] leading-relaxed text-white/80">{intro}</p>
              </section>

              <div className="relative z-10 -mt-20 grid gap-4 px-1 sm:grid-cols-2 lg:-mt-24 lg:grid-cols-4 lg:px-6">
                {heroMetrics.map((m) => (
                  <div key={m.key} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--brand-50)] text-[var(--brand)]">
                      <MetricIcon name={m.icon} />
                    </span>
                    <p className="mt-3 text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">{m.label}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {m.showStars ? <span className="text-[15px] leading-none text-[#C9A84C]">★★★★★</span> : null}
                      <span className="text-[28px] font-[900] leading-none tracking-[-0.5px] text-[var(--ink)]">{m.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-6">
                <section className="col-span-12 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] lg:col-span-8">
                  <div className="relative h-20 overflow-hidden bg-[var(--surface)]">
                    <svg viewBox="0 0 400 80" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                      <g stroke="rgba(0,87,255,0.16)" strokeWidth="1.5">
                        <path d="M20 60h40v-20h40v30h50v-40h60v20h50v-30h60v40h30" />
                        <path d="M0 30h30v20h50v-30h40v40h60v-20h50v25h40v-35h80" opacity="0.6" />
                      </g>
                      <g fill="rgba(0,87,255,0.22)">
                        <circle cx="60" cy="40" r="3" /><circle cx="160" cy="30" r="3" /><circle cx="270" cy="50" r="3" /><circle cx="360" cy="40" r="3" />
                      </g>
                    </svg>
                    <p className="absolute bottom-3 start-5 text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">
                      {t.activeCourseProgress}
                    </p>
                  </div>
                  <div className="p-5 lg:p-6">
                    {latestCourse ? (
                      <>
                        <p className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--brand)]">{t.upNext}</p>
                        <h2 className="mt-1 text-[22px] font-[800] tracking-[-0.4px] text-[var(--ink)]">{latestCourse.title}</h2>
                        <p className="mt-1 text-[13px] font-[500] text-[var(--muted)]">{readinessHint(latestCourse.status, t)}</p>
                        <div className="mt-5">
                          <div className="mb-1.5 flex items-center justify-between text-[12px] font-[800]">
                            <span className="text-[var(--muted)]">{statusLabel(latestCourse.status, latestCourse.latestReview, t)}</span>
                            <span className="text-[var(--ink)]">{readiness(latestCourse.status)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                            <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${readiness(latestCourse.status)}%` }} />
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <p className="text-[12px] font-[700] text-[var(--muted-2)]">
                            {latestCourse.modules} {t.modulesCount} · {latestCourse.enrollments} {t.studentsCount}
                          </p>
                          <Link href={`/educator/courses/${latestCourse.id}`} className="pr-btn-primary ms-auto !min-h-10 px-5 text-[13px]">
                            {t.editCourse}
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="grid place-items-center gap-3 py-8 text-center">
                        <p className="text-[15px] font-[800] text-[var(--ink-2)]">{t.noCourses}</p>
                        <p className="text-[13px] text-[var(--muted)]">{t.createFirstDraft}</p>
                        <NewCourseModal />
                      </div>
                    )}
                  </div>
                </section>

                <section className="col-span-12 grid content-start gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] lg:col-span-4">
                  <p className="text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">{t.analyticsLabel}</p>
                  <div className="grid justify-items-center gap-1">
                    <ProgressDonut percent={metrics.completionRate} />
                    <p className="mt-1 text-[12px] font-[700] text-[var(--muted)]">{t.aggregateCompletionRate}</p>
                  </div>
                  <div className="grid gap-2 border-t border-[var(--border)] pt-4">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-[600] text-[var(--muted)]">{t.studentsCompletedLabel}</span>
                      <span className="font-[900] text-[var(--ink)]">{metrics.completedCertificates}/{metrics.enrollments}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-[600] text-[var(--muted)]">{t.courseAverageRating}</span>
                      <span className="font-[900] text-[var(--ink)]">{metrics.ratingCount ? `${metrics.averageRating?.toFixed(1)}/5.0` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-[600] text-[var(--muted)]">{t.courses}</span>
                      <span className="font-[900] text-[var(--ink)]">{courses.length}</span>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {activeView === "creator" ? (
            <section className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="pr-eyebrow">{t.navCourseCreator}</p>
                  <h1 className="pr-h2 mt-1">{t.editableCourses}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/courses"
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] border border-slate-300 bg-white px-5 text-sm font-[900] text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)]"
                  >
                    {t.exploreExistingCourses}
                  </Link>
                  <NewCourseModal />
                </div>
              </div>
              {editableCourses.length === 0 ? (
                <div className="pr-muted-box py-16 text-center">
                  <p className="text-[15px] font-[800] text-[var(--muted)]">{t.noEditableCoursesYet}</p>
                </div>
              ) : (
                <div className="grid gap-3">{editableCourses.map((course) => <CourseRow key={course.id} course={course} t={t} />)}</div>
              )}
            </section>
          ) : null}

          {activeView === "submissions" ? (
            <section className="grid gap-4">
              <div>
                <p className="pr-eyebrow">{t.navMySubmissions}</p>
                <h1 className="pr-h2 mt-1">{t.submittedCoursesHeading}</h1>
              </div>
              {submittedCourses.length === 0 ? (
                <div className="pr-muted-box py-16 text-center">
                  <p className="text-[15px] font-[800] text-[var(--muted)]">{t.noSubmittedCoursesYet}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                  {submittedCourses.map((course) => (
                    <div key={course.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] p-5 last:border-b-0">
                      <div className="min-w-0">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-[900] uppercase tracking-[1px] ${statusBadgeClass(course.status, course.latestReview)}`}>
                          {statusLabel(course.status, course.latestReview, t)}
                        </span>
                        <h2 className="mt-2 text-[16px] font-[900] text-[var(--ink)]">{course.title}</h2>
                        {course.reviewNote ? <p className="mt-1 text-sm font-[650] text-[var(--muted)]">{course.reviewNote}</p> : null}
                      </div>
                      <Link href={`/educator/courses/${course.id}`} className="pr-btn-ghost !min-h-9 px-4 text-[13px]">{t.viewLabel}</Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeView === "students" ? (
            <section className="grid gap-4">
              <div>
                <p className="pr-eyebrow">{t.navMyStudents}</p>
                <h1 className="pr-h2 mt-1">{t.enrolledStudentsHeading}</h1>
              </div>
              {students.length === 0 ? (
                <div className="pr-muted-box py-16 text-center">
                  <p className="text-[15px] font-[800] text-[var(--muted)]">{t.noEnrolledStudentsYet}</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {students.map((name) => (
                    <article key={name} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                      <p className="text-[15px] font-[900] text-[var(--ink)]">{name}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeView === "messages" ? <MessagesInbox /> : null}

          {activeView === "analytics" ? (
            <section className="grid gap-5">
              <div className="pr-panel p-6 lg:p-8">
                <p className="pr-eyebrow">{t.analyticsLabel}</p>
                <h1 className="pr-h2 mt-1">{t.analyticsPageTitle}</h1>
                <p className="pr-copy mt-2 max-w-2xl">{t.analyticsPageDesc}</p>
              </div>

              {analyticsData.length === 0 ? (
                <div className="pr-muted-box py-16 text-center">
                  <p className="text-[15px] font-[800] text-[var(--muted)]">{t.analyticsNoCourseData}</p>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">{t.analyticsNoCourseHint}</p>
                </div>
              ) : (
                <>
                  {analyticsData.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {analyticsData.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAnalyticsCourseId(c.id)}
                          className={`rounded-full px-4 py-2 text-[13px] font-[800] transition ${
                            analyticsCourseId === c.id
                              ? "bg-[var(--brand)] text-white shadow-[0_2px_8px_rgba(0,87,255,0.25)]"
                              : "border border-[var(--border)] bg-white text-[var(--ink-2)] hover:border-[rgba(0,87,255,0.3)]"
                          }`}
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const course = analyticsData.find((c) => c.id === analyticsCourseId) ?? analyticsData[0];
                    if (!course) return null;

                    const byModule = course.lessons.reduce<Record<string, typeof course.lessons>>((acc, lesson) => {
                      const key = lesson.moduleTitle || "Uncategorized";
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(lesson);
                      return acc;
                    }, {});

                    return (
                      <div className="grid gap-4">
                        <div className="flex flex-wrap items-center gap-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-sm)]">
                          <div>
                            <p className="text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">{t.analyticsCourseLabel}</p>
                            <p className="mt-0.5 text-[17px] font-[900] text-[var(--ink)]">{course.title}</p>
                          </div>
                          <div className="h-8 w-px bg-[var(--border)]" />
                          <div>
                            <p className="text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">{t.analyticsTotalEnrollments}</p>
                            <p className="mt-0.5 text-[28px] font-[900] leading-none text-[var(--ink)]">{course.totalEnrollments}</p>
                          </div>
                          <div className="h-8 w-px bg-[var(--border)]" />
                          <div>
                            <p className="text-[11px] font-[800] uppercase tracking-[1.2px] text-[var(--muted)]">{t.analyticsTotalLessons}</p>
                            <p className="mt-0.5 text-[28px] font-[900] leading-none text-[var(--ink)]">{course.lessons.length}</p>
                          </div>
                        </div>

                        {Object.entries(byModule).map(([moduleTitle, lessons]) => (
                          <div key={moduleTitle} className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
                              <p className="text-[12px] font-[900] uppercase tracking-[1.2px] text-[var(--muted)]">{moduleTitle}</p>
                            </div>
                            <div className="divide-y divide-[var(--border)]">
                              {lessons.map((lesson) => (
                                <div key={lesson.id} className="px-5 py-4">
                                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {lesson.type === "QUIZ" && (
                                        <span className="shrink-0 rounded-full bg-[var(--warning-50)] px-2 py-0.5 text-[10px] font-[900] uppercase tracking-[1px] text-[var(--warning)]">{t.quiz}</span>
                                      )}
                                      <p className="truncate text-[14px] font-[700] text-[var(--ink)]">{lesson.title}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3 text-[13px]">
                                      <span className="font-[600] text-[var(--muted)]">{lesson.completedCount} / {course.totalEnrollments} {t.analyticsStudentsSuffix}</span>
                                      <span className="min-w-[36px] text-right text-[15px] font-[900] text-[var(--ink)]">{lesson.completionRate}%</span>
                                    </div>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${lesson.completionRate}%`,
                                        background: lesson.completionRate >= 75
                                          ? "var(--success)"
                                          : lesson.completionRate >= 40
                                          ? "var(--brand)"
                                          : "var(--warning)"
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Drop-off Analysis */}
                        {(() => {
                          const dropOffLessons = [...course.lessons]
                            .filter((l) => l.type !== "QUIZ" && course.totalEnrollments > 0)
                            .map((l) => ({ ...l, dropOffCount: course.totalEnrollments - l.completedCount }))
                            .sort((a, b) => b.dropOffCount - a.dropOffCount)
                            .slice(0, 5);

                          if (dropOffLessons.length === 0) return null;

                          return (
                            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(234,88,12,0.2)] bg-[var(--warning-50)] shadow-[var(--shadow-sm)]">
                              <div className="flex items-start gap-3 border-b border-[rgba(234,88,12,0.15)] px-5 py-4">
                                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" fill="none" aria-hidden="true">
                                  <path d="M10 3v8M10 15h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                </svg>
                                <div>
                                  <p className="text-[13px] font-[900] text-[var(--ink)]">{t.dropOffTitle}</p>
                                  <p className="mt-0.5 text-[12px] text-[var(--muted)]">{t.dropOffDesc}</p>
                                </div>
                              </div>
                              <div className="divide-y divide-[rgba(234,88,12,0.1)]">
                                {dropOffLessons.map((lesson, idx) => (
                                  <div key={lesson.id} className="flex items-center gap-4 px-5 py-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(234,88,12,0.12)] text-[11px] font-[900] text-[var(--warning)]">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[13px] font-[700] text-[var(--ink)]">{lesson.title}</p>
                                      <p className="text-[11px] text-[var(--muted)]">{lesson.moduleTitle}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <p className="text-[15px] font-[900] text-[var(--warning)]">{lesson.dropOffCount}</p>
                                      <p className="text-[10px] font-[700] uppercase tracking-[0.8px] text-[var(--muted)]">{t.analyticsStudentsSuffix}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </>
              )}
            </section>
          ) : null}

          {activeView === "announce" ? (
            <AnnounceView courses={courses} t={t} />
          ) : null}

          {activeView === "resources" ? (
            <section className="grid gap-5">
              <div className="pr-panel p-6 lg:p-8">
                <p className="pr-eyebrow">{t.navResources}</p>
                <h1 className="pr-h2 mt-1">{t.navResources}</h1>
                <p className="pr-copy mt-2 max-w-2xl">{t.educatorResourcesHint}</p>
              </div>

              <section className="pr-panel p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="pr-eyebrow">{t.creatorInstructions}</p>
                    <h2 className="pr-h2 mt-1">{t.fourStepWorkflow}</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { title: t.resStep1Title, description: t.resStep1Desc },
                    { title: t.resStep2Title, description: t.resStep2Desc },
                    { title: t.resStep3Title, description: t.resStep3Desc },
                    { title: t.resStep4Title, description: t.resStep4Desc }
                  ].map((step) => (
                    <article key={step.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                      <h3 className="text-lg font-[900] text-[var(--ink)]">{step.title}</h3>
                      <p className="mt-2 text-sm font-[650] leading-6 text-[var(--muted)]">{step.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="pr-panel p-6 lg:p-8">
                <p className="pr-eyebrow">{t.beforeSubmitting}</p>
                <h2 className="pr-h2 mt-1">{t.courseReadinessChecklist}</h2>
                <ul className="mt-5 grid gap-3 text-sm font-[650] leading-6 text-[var(--muted)] md:grid-cols-2">
                  <li className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">{t.checklistItem1}</li>
                  <li className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">{t.checklistItem2}</li>
                  <li className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">{t.checklistItem3}</li>
                  <li className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">{t.checklistItem4}</li>
                  <li className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 md:col-span-2">{t.checklistItem5}</li>
                </ul>
              </section>

              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <Link
                  href="/educator-guidelines"
                  className="group rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.28)] hover:shadow-[var(--shadow)]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand)]">
                    <NavIcon name="resources" />
                  </span>
                  <h2 className="mt-5 text-2xl font-[900] tracking-[-0.5px] text-[var(--ink)]">{t.creatorInstructions}</h2>
                  <p className="mt-2 text-sm font-[650] leading-7 text-[var(--muted)]">{t.instructorGuidelinesDesc}</p>
                  <span className="mt-5 inline-flex text-sm font-[900] text-[var(--brand)] group-hover:text-[var(--brand-hover)]">
                    {t.openGuidelines}
                  </span>
                </Link>

                <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                  <div className="aspect-video bg-[linear-gradient(135deg,#EFF6FF_0%,#F8FAFC_58%,#EEF2FF_100%)] p-6">
                    <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-center">
                      <div>
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--brand)] text-white shadow-[0_12px_28px_rgba(0,87,255,0.22)]">
                          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                            <path d="M9 7.5v9l7-4.5-7-4.5Z" />
                          </svg>
                        </span>
                        <h2 className="mt-4 text-xl font-[900] text-[var(--ink)]">{t.educatorOnboardingVideo}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm font-[650] leading-6 text-[var(--muted)]">
                          {t.educatorOnboardingVideoDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {activeView === "journey" ? (
            <section className="portal-settings">
              <div className="pr-panel p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="pr-eyebrow">{t.yourLearningHistory}</p>
                    <h1 className="pr-h2 mt-1">{t.myStudentJourneyTitle}</h1>
                    <p className="pr-copy mt-2 max-w-2xl">{t.studentJourneyDesc}</p>
                  </div>
                  <div className="portal-settings-tabs" role="tablist" aria-label={t.myStudentJourneyTitle}>
                    {([["certificates", t.journeyTabCertificates], ["courses", t.journeyTabCourses]] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setJourneyTab(key)}
                        className={journeyTab === key ? "is-active" : ""}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {journeyTab === "certificates" ? (
                <section className="pr-panel portal-settings-section">
                  <div>
                    <p className="pr-eyebrow">{t.achievementsEyebrow}</p>
                    <h2 className="mt-2 text-2xl font-[900] text-[var(--ink)]">{t.myCertificatesHeading}</h2>
                  </div>
                  {studentJourney.certificates.length === 0 ? (
                    <div className="pr-muted-box py-12 text-center">
                      <p className="text-[14px] font-[700] text-[var(--muted)]">{t.noCertificatesYetHint}</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {studentJourney.certificates.map((cert) => (
                        <article key={cert.certificateUuid} className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF8E8]">
                              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#C9A84C]" fill="none" aria-hidden="true">
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <span className="rounded-full bg-[#FFF8E8] px-2.5 py-1 text-[11px] font-[900] text-[#C9A84C]">
                              {cert.grade}%
                            </span>
                          </div>
                          <div>
                            <p className="text-[15px] font-[900] leading-snug text-[var(--ink)]">{cert.courseTitle}</p>
                            <p className="mt-1 text-[12px] font-[700] text-[var(--muted)]">
                              {t.issuedLabel2} {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <a
                            href={`/courses/${encodeURIComponent(cert.courseId)}/certificate/download`}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-[800] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.3)] hover:bg-white"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                              <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M16 12l-4 4-4-4M12 16V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {t.downloadPdf}
                          </a>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {journeyTab === "courses" ? (
                <section className="pr-panel portal-settings-section">
                  <div>
                    <p className="pr-eyebrow">{t.enrolledAsStudent}</p>
                    <h2 className="mt-2 text-2xl font-[900] text-[var(--ink)]">{t.enrolledCoursesHeading}</h2>
                  </div>
                  {studentJourney.enrollments.length === 0 ? (
                    <div className="pr-muted-box py-12 text-center">
                      <p className="text-[15px] font-[800] text-[var(--muted)]">{t.noEnrolledCoursesYet}</p>
                      <p className="mt-1 text-[13px] text-[var(--muted)]">
                        <Link href="/courses" className="font-[800] text-[var(--brand)] underline-offset-2 hover:underline">
                          {t.browseCourses}
                        </Link>{" "}
                        {t.toStartLearning}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {studentJourney.enrollments.map((enr) => {
                        const pct = enr.totalLessons > 0 ? Math.round((enr.completedLessons / enr.totalLessons) * 100) : 0;
                        return (
                          <article key={enr.courseId} className="flex flex-wrap items-center gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[15px] font-[900] text-[var(--ink)]">{enr.courseTitle}</p>
                                {enr.hasCertificate && (
                                  <span className="rounded-full bg-[#FFF8E8] px-2 py-0.5 text-[11px] font-[900] text-[#C9A84C]">
                                    {t.certifiedBadge}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[12px] font-[700] text-[var(--muted)]">
                                {enr.completedLessons} / {enr.totalLessons} {t.lessonsCompletedShort}
                              </p>
                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                                <div className="h-1.5 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <Link
                              href={`/courses/${encodeURIComponent(enr.courseId)}`}
                              className="shrink-0 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-[800] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.3)] hover:bg-white"
                            >
                              {pct === 100 ? t.reviewCourse : t.continueLearning}
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {recommendedCourses.length > 0 ? (
                    <RecommendedCourses courses={recommendedCourses} />
                  ) : null}
                </section>
              ) : null}
            </section>
          ) : null}

          {activeView === "settings" ? (
            <>
              <PortalSettingsView profile={profile} sessions={sessions} />
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-[var(--shadow-sm)] text-[var(--muted)]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-[900] text-[var(--ink)]">{t.steppingDownTitle}</p>
                    <p className="mt-1 text-[13px] font-[600] leading-6 text-[var(--muted)]">
                      {t.steppingDownBody.split("info@kabulhub.com")[0]}
                      <a href="mailto:info@kabulhub.com" className="font-[800] text-[var(--brand)] underline-offset-2 hover:underline">
                        info@kabulhub.com
                      </a>
                      {t.steppingDownBody.split("info@kabulhub.com")[1]}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
