import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";

const BASE_URL = "https://kabullearn.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, creators, learningPaths] = await Promise.allSettled([
    db.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: { slug: true, updatedAt: true }
    }),
    db.creatorProfile.findMany({
      select: { username: true, updatedAt: true }
    }),
    db.learningPath.findMany({
      select: { slug: true, updatedAt: true }
    })
  ]);

  const courseRoutes: MetadataRoute.Sitemap =
    courses.status === "fulfilled"
      ? courses.value.map((c) => ({
          url: `${BASE_URL}/courses/${encodeURIComponent(c.slug)}`,
          lastModified: c.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.8
        }))
      : [];

  const learningPathRoutes: MetadataRoute.Sitemap =
    learningPaths.status === "fulfilled"
      ? learningPaths.value.map((p) => ({
          url: `${BASE_URL}/learning-paths/${encodeURIComponent(p.slug)}`,
          lastModified: p.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7
        }))
      : [];

  const creatorRoutes: MetadataRoute.Sitemap =
    creators.status === "fulfilled"
      ? creators.value.map((c) => ({
          url: `${BASE_URL}/creators/${encodeURIComponent(c.username)}`,
          lastModified: c.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.6
        }))
      : [];

  return [
    { url: BASE_URL,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/courses`,     lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/learning-paths`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contact`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/support`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...courseRoutes,
    ...learningPathRoutes,
    ...creatorRoutes
  ];
}
