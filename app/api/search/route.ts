import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ courses: [], lessons: [], creators: [] });
  }

  const [courses, lessons, creators] = await Promise.allSettled([
    db.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        OR: [
          { titleEn: { contains: q, mode: "insensitive" } },
          { titlePs: { contains: q, mode: "insensitive" } },
          { titleDa: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
          { descriptionPs: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 5,
      select: { id: true, titleEn: true, titlePs: true, titleDa: true, level: true }
    }),
    db.lesson.findMany({
      where: {
        module: { course: { status: CourseStatus.PUBLISHED } },
        OR: [
          { titleEn: { contains: q, mode: "insensitive" } },
          { titlePs: { contains: q, mode: "insensitive" } },
          { titleDa: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 8,
      select: {
        id: true,
        titleEn: true,
        titlePs: true,
        titleDa: true,
        module: {
          select: {
            id: true,
            course: { select: { id: true, titleEn: true, titlePs: true, titleDa: true } }
          }
        }
      }
    }),
    db.creatorProfile.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { professionalTitle: { contains: q, mode: "insensitive" } },
          { professionalTitlePs: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 3,
      select: { username: true, name: true, professionalTitle: true, avatarUrl: true }
    })
  ]);

  return NextResponse.json({
    courses:  courses.status  === "fulfilled" ? courses.value  : [],
    lessons:  lessons.status  === "fulfilled" ? lessons.value  : [],
    creators: creators.status === "fulfilled" ? creators.value : []
  });
}
