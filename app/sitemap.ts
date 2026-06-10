import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";

const BASE_URL = "https://kabullearn.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, creators] = await Promise.allSettled([
    db.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: { id: true, updatedAt: true }
    }),
    db.creatorProfile.findMany({
      select: { username: true, updatedAt: true }
    })
  ]);

  const courseRoutes: MetadataRoute.Sitemap =
    courses.status === "fulfilled"
      ? courses.value.map((c) => ({
          url: `${BASE_URL}/courses/${encodeURIComponent(c.id)}`,
          lastModified: c.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.8
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
    { url: `${BASE_URL}/contact`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/support`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...courseRoutes,
    ...creatorRoutes
  ];
}
