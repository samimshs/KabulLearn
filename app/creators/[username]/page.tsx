import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CourseStatus } from "@prisma/client";
import { auth } from "@/auth";
import { CourseCard, type CourseCardRow } from "@/components/CourseCard";
import { MessageInstructorButton } from "@/components/MessageInstructorButton";
import { db } from "@/lib/db";
import { getServerLocale } from "@/lib/server-locale";
import { localizeLevel, dictionaries } from "@/lib/i18n";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PR";
}

export default async function CreatorProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername).toLowerCase();
  const locale = await getServerLocale();
  const t = dictionaries[locale];
  const session = await auth();

  // Load profile + all courses this instructor is linked to via CourseInstructor
  const creator = await db.creatorProfile.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      avatarUrl: true,
      professionalTitle: true,
      professionalTitlePs: true,
      professionalTitleDa: true,
      bio: true,
      bioPs: true,
      bioDa: true,
      linkedinUrl: true,
      youtubeUrl: true,
      userId: true,
      user: { select: { image: true } },
      courseInstructors: {
        where: {
          course: { status: CourseStatus.PUBLISHED }
        },
        orderBy: { order: "asc" },
        select: {
          course: {
            select: {
              id: true,
              level: true,
              titleEn: true,
              titlePs: true,
              titleDa: true,
              descriptionEn: true,
              descriptionPs: true,
              descriptionDa: true,
              _count: { select: { enrollments: true } },
              modules: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  order: true,
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, order: true }
                  }
                }
              },
              // All instructors on this course (for the card avatars)
              instructors: {
                orderBy: { order: "asc" },
                select: {
                  order: true,
                  profile: { select: { name: true, username: true, avatarUrl: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!creator) notFound();

  function pickLocalized(en: string | null | undefined, ps: string | null | undefined, da: string | null | undefined) {
    if (locale === "fa") return da || en || null;
    if (locale === "ps") return ps || en || null;
    return en || null;
  }

  // Deduplicate courses (a profile could appear at multiple orders on same course — unlikely but safe)
  const seenIds = new Set<string>();
  const rawCourses = creator.courseInstructors
    .map((ci) => ci.course)
    .filter((c) => { if (seenIds.has(c.id)) return false; seenIds.add(c.id); return true; });

  // Fetch ratings in one query
  const ratingRows = rawCourses.length > 0
    ? await db.courseRating.groupBy({
        by: ["courseId"],
        where: { courseId: { in: rawCourses.map((c) => c.id) } },
        _avg: { rating: true },
        _count: { rating: true }
      }).catch(() => [])
    : [];
  const ratingsByCourse = new Map(ratingRows.map((r) => [
    r.courseId,
    { average: r._avg.rating ?? 0, count: r._count.rating }
  ]));

  const avatarUrl = creator.avatarUrl ?? creator.user?.image ?? null;

  // Messaging target: the instructor's linked account, or (fallback) the user
  // who authored courses under this profile. Either resolves to a real account.
  const messageableUserId =
    creator.userId ??
    (await db.course.findFirst({
      where: { authorProfile: { username } },
      select: { authorId: true }
    }).catch(() => null))?.authorId ??
    null;

  const viewerId = session?.user?.id ?? null;

  const courses: CourseCardRow[] = rawCourses.map((c) => ({
    id: c.id,
    level: c.level,
    titleEn: c.titleEn ?? c.titlePs ?? "",
    titlePs: c.titlePs ?? c.titleEn ?? "",
    titleDa: c.titleDa,
    descriptionEn: c.descriptionEn ?? c.descriptionPs ?? "",
    descriptionPs: c.descriptionPs ?? c.descriptionEn ?? "",
    descriptionDa: c.descriptionDa,
    modules: c.modules.map((m) => ({ id: m.id, order: m.order, lessons: m.lessons })),
    enrollmentCount: c._count.enrollments,
    rating: ratingsByCourse.get(c.id),
    instructors: c.instructors.sort((a, b) => a.order - b.order).map((ci) => ci.profile)
  }));

  const courseCount = courses.length;

  return (
    <main className="pr-page grid gap-8">

      {/* Hero */}
      <section className="pr-panel grid gap-6 p-7 lg:grid-cols-[auto_1fr] lg:p-10">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-full object-cover shadow-[var(--shadow)]" />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-full bg-[var(--brand-50)] text-2xl font-[900] text-[var(--brand)] shadow-[var(--shadow-sm)]">
            {initials(creator.name)}
          </span>
        )}
        <div>
          <p className="pr-eyebrow">{t.instructorProfile}</p>
          <h1 className="pr-h1 mt-4">{creator.name}</h1>
          {pickLocalized(creator.professionalTitle, creator.professionalTitlePs, creator.professionalTitleDa) && (
            <p className="mt-3 text-lg font-[800] text-[var(--brand)]">{pickLocalized(creator.professionalTitle, creator.professionalTitlePs, creator.professionalTitleDa)}</p>
          )}
          {pickLocalized(creator.bio, creator.bioPs, creator.bioDa) && (
            <p className="pr-copy mt-5 max-w-3xl">{pickLocalized(creator.bio, creator.bioPs, creator.bioDa)}</p>
          )}
          <p className="mt-4 text-[13px] font-[700] text-[var(--muted)]">
            {courseCount} {courseCount !== 1 ? t.publishedCoursesPlural : t.publishedCourse}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <MessageInstructorButton
              instructorUserId={messageableUserId}
              instructorName={creator.name}
              viewerId={viewerId}
              viewerRole={session?.user?.role ?? null}
              loginHref={`/login?callbackUrl=${encodeURIComponent(`/creators/${username}`)}`}
              variant="primary"
            />
            {creator.linkedinUrl && (
              <Link href={creator.linkedinUrl} className="pr-btn-ghost" target="_blank" rel="noreferrer">
                LinkedIn
              </Link>
            )}
            {creator.youtubeUrl && (
              <Link href={creator.youtubeUrl} className="pr-btn-ghost" target="_blank" rel="noreferrer">
                YouTube
              </Link>
            )}
            <Link href="/courses" className="pr-btn-ghost">
              ← {t.browseAllCourses}
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section>
        <div className="mb-5">
          <p className="pr-eyebrow">{t.courses}</p>
          <h2 className="pr-h2 mt-2">{t.publishedCoursesBy} {creator.name}</h2>
        </div>
        {courses.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="pr-muted-box text-center font-[800] text-[var(--muted)]">
            {t.noPublishedCourses}
          </div>
        )}
      </section>

    </main>
  );
}
