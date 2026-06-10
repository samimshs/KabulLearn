"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CourseCard } from "@/components/CourseCard";
import { RecommendedCourses } from "@/components/RecommendedCourses";
import { MessagesInbox } from "@/components/MessagesInbox";
import { PortalSettingsView } from "@/components/PortalSettingsView";
import { dropEnrollment } from "@/lib/actions/enrollment-actions";
import { localize, localizeLevel } from "@/lib/i18n";
import type { RecommendedCourse } from "@/lib/recommendations";

type DashCourse = {
  id: string;
  titleEn: string; titlePs: string; titleDa?: string | null;
  descriptionEn: string; descriptionPs: string; descriptionDa?: string | null;
  level?: string | null;
  hasCertificate: boolean;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  percent: number;
  resumeLessonId: string | null;
  nextModuleTitle: string;
  thumbIndex: number;
  instructors: Array<{ name: string; username: string; avatarUrl: string | null }>;
  enrolledAt: Date | string;
};

type DashCertificate = {
  id: string;
  grade: number;
  issuedAt: Date | string;
  verificationCode: string;
  courseId: string;
  courseTitleEn: string;
  courseTitlePs: string;
  courseTitleDa: string | null;
};

type DashboardViewProps = {
  userName: string | null;
  userProfile: {
    name: string;
    email: string;
    bio: string;
    image: string | null;
    linkedinUrl: string | null;
  };
  sessions: Array<{
    id: string;
    label: string;
    expires: string;
    current?: boolean;
  }>;
  dbError?: boolean;
  stats: { inProgress: number; lessonsDone: number; certificates: number; quizAttempts: number };
  overall: { percent: number; lessonsCompleted: number; totalLessons: number; coursesCompleted: number; coursesEnrolled: number };
  streak: { current: number; longest: number } | null;
  courses: DashCourse[];
  recommended: RecommendedCourse[];
  certificates: DashCertificate[];
};

/* Category-aware gradient thumbnails. */
const PALETTE = [
  "linear-gradient(135deg,#0057FF 0%,#0E7490 100%)",  // data science: blue/teal
  "linear-gradient(135deg,#18825C 0%,#0E7490 100%)",  // statistics: green/teal
  "linear-gradient(135deg,#7C3AED 0%,#0057FF 100%)",  // AI: purple/blue
  "linear-gradient(135deg,#B06C00 0%,#C42B2B 100%)",  // web dev: orange/red
  "linear-gradient(135deg,#0E7490 0%,#475569 100%)",  // computer basics: blue/gray
  "linear-gradient(135deg,#4338CA 0%,#7C3AED 100%)",  // physics: indigo/purple
];

function courseGradient(title: string, index: number): string {
  const t = title.toLowerCase();
  if (/data|machine|python|ml|pandas/.test(t)) return PALETTE[0];
  if (/statistic|probability|regression/.test(t)) return PALETTE[1];
  if (/\bai\b|intelligence|neural|deep/.test(t)) return PALETTE[2];
  if (/web|html|css|javascript|frontend/.test(t)) return PALETTE[3];
  if (/computer|hardware|software|basics|digital/.test(t)) return PALETTE[4];
  if (/physics|mechanics|motion|energy/.test(t)) return PALETTE[5];
  return PALETTE[index % PALETTE.length];
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function estimateTime(lessonCount: number): string {
  const mins = lessonCount * 20;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/* Decorative dotted pattern for thumbnails */
function ThumbPattern() {
  return (
    <svg viewBox="0 0 200 80" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <circle key={i} cx={(i % 8) * 26 + 12} cy={Math.floor(i / 8) * 26 + 12} r={2} fill="white" opacity={0.18} />
      ))}
    </svg>
  );
}

function AvatarStack({ instructors }: { instructors: DashCourse["instructors"] }) {
  if (!instructors || instructors.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
      {instructors.slice(0, 4).map((inst) => (
        <Link
          key={inst.username}
          href={`/creators/${encodeURIComponent(inst.username)}`}
          title={inst.name}
          aria-label={inst.name}
          className="relative inline-block rounded-full ring-2 ring-[var(--card)] transition hover:z-10 hover:ring-[var(--brand)]"
        >
          {inst.avatarUrl ? (
            <Image src={inst.avatarUrl} alt={inst.name} width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-50)] text-[10px] font-[900] text-[var(--brand)]">
              {initials(inst.name)}
            </span>
          )}
        </Link>
      ))}
      {instructors.length > 4 && (
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-[var(--surface)] text-[10px] font-[800] text-[var(--muted)] ring-2 ring-[var(--card)]">
          +{instructors.length - 4}
        </span>
      )}
    </div>
  );
}

function ProgressRing({ percent, size = 132 }: { percent: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${percent}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--brand)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circ} ${circ}`} className="transition-all"
        />
      </svg>
      <span className="absolute text-[28px] font-[900] tracking-[-1px] text-[var(--ink)]">{percent}%</span>
    </div>
  );
}

function iconPath(name: "dashboard" | "courses" | "certificates" | "messages" | "settings") {
  const paths = {
    dashboard: "M4 6.5 12 3l8 3.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z M9 20v-6h6v6",
    courses: "M4 5.5C6.2 4.7 9.7 5 12 6.6v12c-2.3-1.6-5.8-1.9-8-1.1v-12Z M12 6.6c2.3-1.6 5.8-1.9 8-1.1v12c-2.2-.8-5.7-.5-8 1.1v-12Z",
    certificates: "M12 13.5A5.5 5.5 0 1 0 12 2.5a5.5 5.5 0 0 0 0 11Z M8.8 12.7 7.5 21l4.5-2.5 4.5 2.5-1.3-8.3",
    messages: "M4.5 5h15v10h-9L6 18.5V15H4.5V5Z",
    settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z M19.4 15a8 8 0 0 0 .1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 6.5h-4L10.6 9a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2.1-1.5Z"
  };

  return paths[name];
}

function PortalIcon({ name }: { name: "dashboard" | "courses" | "certificates" | "messages" | "settings" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d={iconPath(name)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function activeViewFromPath(pathname: string) {
  if (pathname.endsWith("/my-courses")) return "courses";
  if (pathname.endsWith("/certificates")) return "certificates";
  if (pathname.endsWith("/messages")) return "messages";
  if (pathname.endsWith("/settings")) return "settings";
  return "dashboard";
}

export function DashboardView({ userName, userProfile, sessions, dbError, stats, overall, streak, courses, recommended, certificates }: DashboardViewProps) {
  const { locale, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [droppingCourseId, setDroppingCourseId] = useState<string | null>(null);
  const [dropCandidate, setDropCandidate] = useState<{ id: string; title: string } | null>(null);
  const [dropStatus, setDropStatus] = useState("");
  const [isDropPending, startDropTransition] = useTransition();
  const activeView = activeViewFromPath(pathname);

  const visibleCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => localize(locale, c.titleEn, c.titlePs, c.titleDa).toLowerCase().includes(q));
  }, [courses, query, locale]);

  const activeCourse =
    courses.find((c) => c.percent > 0 && c.percent < 100) ?? courses.find((c) => c.percent < 100) ?? null;

  const firstName = userName?.split(/\s+/)[0] ?? null;

  function confirmDropCourse(courseId: string) {
    setDropStatus("");
    setDroppingCourseId(courseId);
    startDropTransition(async () => {
      const result = await dropEnrollment({ courseId });
      if (!result.ok) {
        setDropStatus(result.error);
        setDroppingCourseId(null);
        return;
      }
      setDropStatus("Course dropped.");
      setDroppingCourseId(null);
      setDropCandidate(null);
      router.refresh();
    });
  }

  const statTiles = [
    { value: stats.inProgress, label: t.dashInProgress },
    { value: stats.lessonsDone, label: t.dashLessonsDone },
    { value: stats.certificates, label: t.dashCertificates },
    { value: stats.quizAttempts, label: t.dashQuizAttempts },
  ];

  if (dbError) {
    return (
      <main className="pr-page">
        <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-8 text-center">
          <p className="pr-eyebrow text-[var(--warning)]">{t.dbUnavailable}</p>
          <p className="mt-2 font-[700] text-[var(--warning)]">{t.dbUnavailableHint}</p>
        </div>
      </main>
    );
  }

  const navItems = [
    { href: "/dashboard", label: t.dashboard, icon: "dashboard" as const, view: "dashboard" },
    { href: "/dashboard/my-courses", label: t.myCourses, icon: "courses" as const, view: "courses" },
    { href: "/dashboard/certificates", label: t.certificatesTitle, icon: "certificates" as const, view: "certificates" },
    { href: "/dashboard/messages", label: t.messagesTitle, icon: "messages" as const, view: "messages" },
    { href: "/dashboard/settings", label: t.settingsTitle, icon: "settings" as const, view: "settings" },
  ];

  return (
    <main className="pr-page">
      <div className="student-portal-shell">
        <aside className="student-portal-sidebar" aria-label={t.myPortal}>
          <div className="student-portal-brand">
            <span className="student-portal-brand-icon">
              {/* Pencil — student */}
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </span>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)", display: "block" }}>{t.myPortal}</span>
            </div>
          </div>
          <nav className="student-portal-nav">
            {navItems.map((item) => {
              const active = activeView === item.view;
              return (
                <Link key={item.href} href={item.href} className={`student-portal-nav-link ${active ? "is-active" : ""}`}>
                  <PortalIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="student-portal-content">
          {activeView === "dashboard" ? (
            <div className="grid gap-7">
      {/* ── 1. Welcome card + quick stats ─────────────────────────── */}
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[linear-gradient(135deg,#0057FF_0%,#0E7490_100%)] p-7 text-white shadow-[var(--shadow-lg)] lg:p-9">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-[800] uppercase tracking-[3px] text-white/70">{t.myLearning}</p>
            <h1 className="mt-3 text-[clamp(28px,4vw,42px)] font-[800] leading-tight tracking-[-1px]">
              {t.welcomeBack}{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <p className="mt-2 text-[15px] font-[500] text-white/80">{t.continueJourney}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statTiles.map((s) => (
              <div key={s.label} className="rounded-[var(--radius-lg)] bg-white/15 px-4 py-3 backdrop-blur-sm">
                <p className="text-[26px] font-[900] leading-none">{s.value}</p>
                <p className="mt-1.5 text-[11px] font-[800] uppercase tracking-[0.5px] text-white/75">{s.label}</p>
              </div>
            ))}
            {streak && streak.current > 0 && (
              <div className="col-span-2 flex items-center gap-3 rounded-[var(--radius-lg)] bg-white/15 px-4 py-3 backdrop-blur-sm">
                <svg viewBox="0 0 20 20" className="h-7 w-7 shrink-0" fill="none" aria-hidden="true">
                  <path d="M10 2C9 5 6 7 6 10.5a4 4 0 0 0 8 0c0-1.5-1-3-2-4-0.5 1-1.5 1.5-2 1.5 0-2 1-4 0-6Z" fill="rgba(255,180,0,0.9)" stroke="rgba(255,140,0,0.8)" strokeWidth="0.5" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[22px] font-[900] leading-none">{streak.current} <span className="text-[13px] font-[700]">day{streak.current !== 1 ? "s" : ""}</span></p>
                  <p className="mt-0.5 text-[11px] font-[800] uppercase tracking-[0.5px] text-white/75">
                    Learning Streak {streak.longest > streak.current ? `· Best: ${streak.longest}d` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2 + 3. Continue Learning + Progress Overview ──────────── */}
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Continue Learning */}
        {activeCourse ? (
          <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <div className="relative h-28 overflow-hidden" style={{ background: courseGradient(localize(locale, activeCourse.titleEn, activeCourse.titlePs, activeCourse.titleDa), activeCourse.thumbIndex) }}>
              <ThumbPattern />
              <span className="absolute bottom-3 start-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-[900] uppercase tracking-[1px] text-white backdrop-blur-sm">
                {t.continueLearning}
              </span>
            </div>
            <div className="p-5">
              <p className="text-[11px] font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.upNext}</p>
              <h2 className="mt-1 text-xl font-[800] tracking-[-0.4px] text-[var(--ink)]">
                {localize(locale, activeCourse.titleEn, activeCourse.titlePs, activeCourse.titleDa)}
              </h2>
              {activeCourse.nextModuleTitle ? (
                <p className="mt-1 text-[13px] font-[600] text-[var(--muted)]">{activeCourse.nextModuleTitle}</p>
              ) : null}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[12px] font-[800] text-[var(--muted)]">
                  <span>{t.progress}</span>
                  <span className="text-[var(--brand)]">{activeCourse.percent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${activeCourse.percent}%` }} role="progressbar" aria-valuenow={activeCourse.percent} aria-valuemin={0} aria-valuemax={100} />
                </div>
              </div>
              <Link
                href={activeCourse.resumeLessonId ? `/courses/${activeCourse.id}/lessons/${activeCourse.resumeLessonId}` : `/courses/${activeCourse.id}`}
                className="pr-btn-primary mt-5"
              >
                {activeCourse.percent > 0 ? t.continueBtn : t.startCourse}
              </Link>
            </div>
          </article>
        ) : (
          <article className="grid place-content-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-lg font-[800] text-[var(--ink-2)]">{t.noActiveCourse}</p>
            <p className="text-sm font-[500] text-[var(--muted)]">{t.exploreToStart}</p>
            <Link href="/courses" className="pr-btn-primary mx-auto mt-2">{t.browseCourses}</Link>
          </article>
        )}

        {/* Progress Overview */}
        <article className="grid content-start gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]">
          <p className="pr-eyebrow">{t.yourProgress}</p>
          <div className="grid justify-items-center gap-1">
            <ProgressRing percent={overall.percent} />
            <p className="mt-1 text-[12px] font-[700] text-[var(--muted)]">{t.overallProgress}</p>
          </div>
          <div className="grid gap-2 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-[600] text-[var(--muted)]">{t.lessonsCompletedLabel}</span>
              <span className="font-[900] text-[var(--ink)]">{overall.lessonsCompleted}/{overall.totalLessons}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-[600] text-[var(--muted)]">{t.coursesCompletedLabel}</span>
              <span className="font-[900] text-[var(--ink)]">{overall.coursesCompleted}/{overall.coursesEnrolled}</span>
            </div>
          </div>
        </article>
      </section>
            </div>
          ) : null}

          {activeView === "courses" ? (
            <div className="grid gap-7">
      {/* ── 4. My Courses ─────────────────────────────────────────── */}
      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="pr-eyebrow">{t.myLearning}</p>
            <h2 className="pr-h2 mt-1">{t.myCourses}</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--muted)] focus-within:border-[var(--brand)] focus-within:bg-white">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.5" />
                <path d="m10 10 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchYourCourses}
                aria-label={t.searchYourCourses}
                className="w-36 bg-transparent text-[12px] font-[700] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
            <Link href="/courses" className="pr-btn-ghost !min-h-9 px-3 text-[12px]">{t.availableCourses}</Link>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="pr-muted-box text-center">
            <p className="text-lg font-[800] text-[var(--muted)]">{t.noEnrolledCourses}</p>
            <Link href="/courses" className="pr-btn-primary mt-5">{t.browseCourses}</Link>
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="pr-muted-box text-center text-[var(--muted)]">{t.noResults}</div>
        ) : (
          <>
            {dropStatus ? <p className="rounded-[var(--radius)] bg-[var(--surface)] px-4 py-3 text-sm font-[800] text-[var(--muted)]">{dropStatus}</p> : null}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => {
                const title = localize(locale, course.titleEn, course.titlePs, course.titleDa);
                const level = localizeLevel(course.level, locale);
                const isComplete = course.percent >= 100;
                const lessonCount = course.totalLessons;
                const isDropping = isDropPending && droppingCourseId === course.id;
                return (
                  <article key={course.id} className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.28)] hover:shadow-[var(--shadow)]">
                    <Link href={`/courses/${course.id}?from=my-courses`} className="relative block h-24 overflow-hidden" style={{ background: courseGradient(title, course.thumbIndex) }} aria-label={title}>
                      <ThumbPattern />
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {level ? <span className="pr-badge">{level}</span> : null}
                        {course.hasCertificate && <span className="pr-badge pr-badge-cert">{t.certificateIncluded}</span>}
                        {isComplete && <span className="pr-badge pr-badge-green">{t.completed}</span>}
                      </div>
                      <h3 className="text-[15px] font-[800] leading-[1.3] tracking-[-0.3px] text-[var(--ink)]">
                        <Link href={`/courses/${course.id}`} className="hover:text-[var(--brand)]">{title}</Link>
                      </h3>
                      <p className="mt-1.5 text-[11px] font-[800] uppercase tracking-[0.5px] text-[var(--muted-2)]">
                        {course.totalModules} {t.modules} · {lessonCount} {t.lessons} · ~{estimateTime(lessonCount)}
                      </p>

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] font-[800]">
                          <span className="text-[var(--muted)]">{t.progress}</span>
                          <span className="text-[var(--brand)]">{course.percent}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                          <div className={`h-1.5 rounded-full transition-all ${isComplete ? "bg-[var(--success)]" : "bg-[var(--brand)]"}`} style={{ width: `${course.percent}%` }} role="progressbar" aria-valuenow={course.percent} aria-valuemin={0} aria-valuemax={100} />
                        </div>
                      </div>

                      <div className="mt-auto grid gap-3 pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <AvatarStack instructors={course.instructors} />
                          <Link
                            href={
                              isComplete
                                ? `/courses/${course.id}?from=my-courses`
                                : course.resumeLessonId
                                  ? `/courses/${course.id}/lessons/${course.resumeLessonId}?from=my-courses`
                                  : `/courses/${course.id}?from=my-courses`
                            }
                            className="pr-btn-primary !min-h-9 px-4 text-[12px]"
                          >
                            {isComplete ? t.reviewCourse : course.percent > 0 ? t.continueBtn : t.startCourse}
                          </Link>
                        </div>
                        {!isComplete && (
                          <button
                            type="button"
                            onClick={() => setDropCandidate({ id: course.id, title })}
                            disabled={isDropping}
                            className="inline-flex min-h-9 w-full items-center justify-center rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-white px-3 text-[12px] font-[900] text-[var(--danger)] transition hover:bg-[var(--danger-50)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDropping ? t.droppingLabel : t.dropCourse}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {recommended.length > 0 ? <RecommendedCourses courses={recommended} /> : null}
            </div>
          ) : null}

          {activeView === "certificates" ? (
            <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="pr-eyebrow">{t.dashCertificates}</p>
            <h2 className="pr-h2 mt-1">{t.certificatesTitle}</h2>
          </div>
          {certificates.length > 0 ? (
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-[800] text-[var(--muted)]">
              {certificates.length} {certificates.length === 1 ? t.certificateSingular : t.certificatePlural}
            </span>
          ) : null}
        </div>
        {certificates.length === 0 ? (
          <div className="pr-muted-box text-center">
            <p className="text-[15px] font-[800] text-[var(--ink-2)]">{t.noCertificates}</p>
            <p className="mt-1 text-sm font-[500] text-[var(--muted)]">{t.earnCertificatesHint}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            {certificates.map((cert, i) => {
              const grade = Math.round(cert.grade);
              const gradeTone =
                grade >= 90 ? "border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] text-[var(--success)]"
                : grade >= 70 ? "border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] text-[var(--brand)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
              return (
                <div
                  key={cert.id}
                  className={`flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface)] ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[rgba(124,58,237,0.08)] text-[#7C3AED]" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.7" /><path d="m9 13-1.5 8L12 19l4.5 2L15 13" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-[800] tracking-[-0.2px] text-[var(--ink)]">
                      {localize(locale, cert.courseTitleEn, cert.courseTitlePs, cert.courseTitleDa)}
                    </h3>
                    <p className="mt-0.5 text-[12px] font-[600] text-[var(--muted)]">
                      {t.issuedLabel} {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>

                  <span className={`hidden shrink-0 items-center rounded-full border px-3 py-1 text-[12px] font-[900] sm:inline-flex ${gradeTone}`}>
                    {grade}%
                  </span>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/courses/${encodeURIComponent(cert.courseId)}/certificate/download`}
                      className="pr-btn-ghost !min-h-9 px-3 text-[12px]"
                      aria-label={t.downloadCertificatePdf}
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                    <Link href={`/courses/${encodeURIComponent(cert.courseId)}/certificate`} className="pr-btn-primary !min-h-9 px-4 text-[12px]">
                      {t.viewCertificate}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
          ) : null}

          {activeView === "messages" ? (
            <section className="grid gap-4">
              <div>
                <p className="pr-eyebrow">{t.myLearning}</p>
                <h2 className="pr-h2 mt-1">{t.messagesTitle}</h2>
              </div>
              <MessagesInbox />
            </section>
          ) : null}

          {activeView === "settings" ? (
            <PortalSettingsView profile={userProfile} sessions={sessions} />
          ) : null}
        </section>
      </div>
      {dropCandidate ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="drop-course-title">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[rgba(196,43,43,0.18)] bg-white p-6 text-start shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--danger-50)] text-[var(--danger)]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path d="M12 8v5M12 16.5h.01M10.2 4.8 2.9 18a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3L13.8 4.8a2.1 2.1 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id="drop-course-title" className="text-xl font-[900] tracking-[-0.4px] text-[var(--ink)]">{t.dropCourseConfirmTitle}</h2>
                <p className="mt-2 text-sm font-[650] leading-6 text-[var(--muted)]">
                  {t.dropCourseConfirmBody}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDropCandidate(null)}
                disabled={isDropPending}
                className="pr-btn-ghost !min-h-10 px-4"
              >
                {t.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => confirmDropCourse(dropCandidate.id)}
                disabled={isDropPending}
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--danger)] bg-[var(--danger)] px-5 text-sm font-[900] text-white shadow-sm transition hover:bg-[#a92323] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDropPending ? t.droppingLabel : t.dropCourse}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
