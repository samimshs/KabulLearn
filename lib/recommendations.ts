import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";

export type RecommendedCourse = {
  id: string;
  titleEn: string;
  titlePs: string;
  titleDa: string | null;
  level: string | null;
  enrollmentCount: number;
  rating: number | null;
  hasCertificate: boolean;
};

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];

function levelScore(courseLevel: string | null, enrolledLevels: string[]): number {
  if (!courseLevel || enrolledLevels.length === 0) return 0;
  const lc = courseLevel.toLowerCase();
  if (enrolledLevels.some((el) => el.toLowerCase() === lc)) return 2;
  const ci = LEVEL_ORDER.indexOf(lc);
  if (ci === -1) return 0;
  for (const el of enrolledLevels) {
    const ei = LEVEL_ORDER.indexOf(el.toLowerCase());
    if (ei !== -1 && Math.abs(ci - ei) === 1) return 1;
  }
  return 0;
}

/**
 * Returns up to `limit` published courses the user hasn't enrolled in,
 * ranked by: level affinity → popularity → rating → recency.
 */
export async function getRecommendedCourses(
  enrolledIds: string[],
  enrolledLevels: string[],
  limit = 4
): Promise<RecommendedCourse[]> {
  const rows = await db.course.findMany({
    where: {
      AND: [
        { status: CourseStatus.PUBLISHED },
        enrolledIds.length > 0 ? { id: { notIn: enrolledIds } } : {}
      ]
    },
    select: {
      id: true,
      titleEn: true, titlePs: true, titleDa: true,
      level: true,
      publishedAt: true,
      _count: { select: { enrollments: true } },
      modules: { select: { lessons: { select: { isFinalTest: true } } } },
      ratings: { select: { rating: true } }
    }
  });

  const now = Date.now();

  const scored = rows.map((c) => {
    const avgRating =
      c.ratings.length > 0
        ? c.ratings.reduce((s, r) => s + r.rating, 0) / c.ratings.length
        : null;

    let score = 0;
    score += levelScore(c.level, enrolledLevels);
    score += Math.min(2, Math.floor(c._count.enrollments / 20));
    if (avgRating !== null && avgRating >= 4.0) score += 1;
    if (c.publishedAt && now - c.publishedAt.getTime() < 90 * 24 * 60 * 60 * 1000) score += 0.5;

    return {
      course: {
        id: c.id,
        titleEn: c.titleEn ?? "",
        titlePs: c.titlePs ?? "",
        titleDa: c.titleDa ?? null,
        level: c.level ?? null,
        enrollmentCount: c._count.enrollments,
        rating: avgRating,
        hasCertificate:
          c.modules.length > 0 && c.modules.every((m) => m.lessons.some((l) => l.isFinalTest))
      },
      score
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.course);
}
