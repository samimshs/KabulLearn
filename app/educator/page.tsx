import Link from "next/link";
import { redirect } from "next/navigation";
import { CourseStatus, ProgressStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CourseSubmitButton } from "@/components/educator/CourseSubmitButton";
import { DeleteCourseButton } from "@/components/educator/DeleteCourseButton";
import { NewCourseModal } from "@/components/educator/NewCourseModal";
import { EditProfileModal } from "@/components/educator/EditProfileModal";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";

function statusLabel(status: CourseStatus) {
  return status.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
}

function statusBadgeClass(status: CourseStatus) {
  if (status === CourseStatus.PUBLISHED) return "bg-[var(--success-50)] text-[var(--success)]";
  if (status === CourseStatus.PENDING_REVIEW) return "bg-[var(--warning-50)] text-[var(--warning)]";
  return "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
}

function statusStripeClass(status: CourseStatus) {
  if (status === CourseStatus.PUBLISHED) return "bg-[var(--success)]";
  if (status === CourseStatus.PENDING_REVIEW) return "bg-[var(--warning)]";
  return "bg-[var(--border)]";
}

const METRIC_ACCENTS = [
  "border-s-[var(--brand)]",
  "border-s-[var(--success)]",
  "border-s-[#7C3AED]",
  "border-s-[var(--brand)]",
  "border-s-[var(--warning)]",
];

export default async function EducatorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Feducator");
  if (session.user.role === UserRole.ADMIN) redirect("/admin");
  if (session.user.role !== UserRole.EDUCATOR) redirect("/dashboard");

  const educator = session.user;
  const locale = await getServerLocale();
  const t = dictionaries[locale];

  let courses: Awaited<ReturnType<typeof db.course.findMany<{ include: { _count: { select: { modules: true; enrollments: true } } } }>>> = [];
  let profile: { name: string | null; bio: string | null; image: string | null } | null = null;
  let analytics = { enrollments: 0, submissions: 0, completions: 0, averageRating: 0, ratingCount: 0 };
  let dbError = false;

  try {
    [courses, profile] = await Promise.all([
      db.course.findMany({
        where: { authorId: educator.id },
        orderBy: [{ updatedAt: "desc" }],
        include: { _count: { select: { modules: true, enrollments: true } } }
      }),
      db.user.findUnique({
        where: { id: educator.id },
        select: { name: true, bio: true, image: true }
      })
    ]);
  } catch {
    dbError = true;
  }

  const draftCount = courses.filter((c) => c.status === CourseStatus.DRAFT).length;
  const reviewCount = courses.filter((c) => c.status === CourseStatus.PENDING_REVIEW).length;
  const publishedCount = courses.filter((c) => c.status === CourseStatus.PUBLISHED).length;
  const courseIds = courses.map((c) => c.id);

  if (!dbError && courseIds.length > 0) {
    try {
      const [enrollments, submissions, completions, ratingAggregate] = await Promise.all([
        db.enrollment.count({ where: { courseId: { in: courseIds } } }),
        db.quizSubmission.count({ where: { lesson: { module: { courseId: { in: courseIds } } } } }),
        db.userProgress.count({ where: { status: ProgressStatus.COMPLETED, lesson: { module: { courseId: { in: courseIds } } } } }),
        db.courseRating.aggregate({ where: { courseId: { in: courseIds } }, _avg: { rating: true }, _count: { rating: true } })
      ]);
      analytics = {
        enrollments,
        submissions,
        completions,
        averageRating: ratingAggregate._avg.rating ?? 0,
        ratingCount: ratingAggregate._count.rating
      };
    } catch { /* analytics unavailable */ }
  }

  const metrics = [
    { label: t.courses, value: courses.length },
    { label: t.enrollmentsLabel, value: analytics.enrollments },
    { label: t.quizAttemptsLabel, value: analytics.submissions },
    { label: t.completedLessonsLabel, value: analytics.completions },
    { label: t.avgRatingLabel, value: analytics.ratingCount ? analytics.averageRating.toFixed(1) : "—" },
  ];

  return (
    <main className="pr-page grid gap-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(0,87,255,0.12)] bg-[linear-gradient(135deg,#0057FF_0%,#0E7490_100%)] p-7 text-white shadow-[var(--shadow-lg)] lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-[800] uppercase tracking-[3px] text-white/70">{t.educatorDashboard}</p>
            <h1 className="mt-3 text-[clamp(28px,4vw,48px)] font-[800] leading-tight tracking-tight">
              {profile?.name ? `Hi, ${profile.name.split(" ")[0]}.` : t.courseWorkspace}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] font-[500] leading-relaxed text-white/80">
              {t.educatorIntro}
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              {[
                { label: t.drafts, value: draftCount },
                { label: t.inReview, value: reviewCount },
                { label: t.statusPublished, value: publishedCount },
              ].map((s) => (
                <div key={s.label} className="rounded-[var(--radius-lg)] bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                  <p className="text-[22px] font-[800] leading-none text-white">{s.value}</p>
                  <p className="mt-1 text-[11px] font-[700] uppercase tracking-[1px] text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DB error ─────────────────────────────────────────── */}
      {dbError && (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-6 text-center">
          <p className="pr-eyebrow text-[var(--warning)]">{t.dbUnavailable}</p>
          <p className="mt-2 text-sm font-[700] text-[var(--warning)]">{t.dbUnavailableHint}</p>
        </div>
      )}

      {/* ── Analytics ────────────────────────────────────────── */}
      {!dbError && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Analytics">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`rounded-[var(--radius-lg)] border border-[var(--border)] border-s-4 bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] ${METRIC_ACCENTS[i]}`}
            >
              <p className="text-[30px] font-[800] leading-none tracking-[-0.5px] text-[var(--ink)]">{m.value}</p>
              <p className="mt-2 text-[11px] font-[800] uppercase tracking-[1.4px] text-[var(--muted)]">{m.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── Course list ──────────────────────────────────────── */}
      {!dbError && (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="pr-eyebrow">{t.courses}</p>
              <h2 className="pr-h2 mt-1">{t.yourWorkspace}</h2>
            </div>
            <NewCourseModal />
          </div>

          {courses.length === 0 ? (
            <div className="pr-muted-box py-16 text-center">
              <p className="text-[15px] font-[700] text-[var(--muted)]">{t.noCoursesYet}</p>
              <p className="mt-1 text-[13px] text-[var(--muted-2)]">{t.createFirstDraft}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="flex overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow)]"
                >
                  {/* Status stripe */}
                  <div className={`w-1 shrink-0 ${statusStripeClass(course.status)}`} />

                  {/* Content */}
                  <div className="flex flex-1 flex-wrap items-start gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-[800] uppercase tracking-[1px] ${statusBadgeClass(course.status)}`}>
                          {statusLabel(course.status)}
                        </span>
                        <span className="text-[12px] font-[600] text-[var(--muted-2)]">{course.slug}</span>
                      </div>
                      <h3 className="mt-2 text-[16px] font-[800] tracking-tight text-[var(--ink)]">{course.titleEn}</h3>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">{course.descriptionEn}</p>
                      <p className="mt-2 text-[12px] font-[700] text-[var(--muted-2)]">
                        {course._count.modules} {t.modulesCount} · {course._count.enrollments} {t.studentsCount}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/educator/courses/${course.id}`} className="pr-btn-primary !min-h-9 px-4 text-[13px]">
                        {t.editCourse}
                      </Link>
                      {course.status === CourseStatus.DRAFT && <CourseSubmitButton courseId={course.id} />}
                      <DeleteCourseButton courseId={course.id} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Educator profile ─────────────────────────────────── */}
      {!dbError && (
        <section className="grid gap-3">
          <div>
            <p className="pr-eyebrow">{t.profileLabel}</p>
            <h2 className="pr-h2 mt-1">{t.publicEducatorDetails}</h2>
          </div>
          <EditProfileModal name={profile?.name} bio={profile?.bio} image={profile?.image} />
        </section>
      )}
    </main>
  );
}
