"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEducator } from "@/lib/rbac";
import { db } from "@/lib/db";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3).max(100).optional(),
  body: z.string().trim().min(10).max(1000)
});

export async function postCourseAnnouncement(input: { courseId: string; title?: string; body: string }) {
  try {
    const session = await requireEducator();
    const values = schema.parse(input);

    // Ensure this educator owns the course
    const course = await db.course.findUnique({
      where: { id: values.courseId },
      select: { authorId: true, slug: true, titleEn: true, titlePs: true }
    });
    if (!course || course.authorId !== session.id) {
      return { ok: false, error: "Course not found or access denied." };
    }

    // Save the announcement record
    await db.courseAnnouncement.create({
      data: { courseId: values.courseId, title: values.title ?? null, body: values.body }
    });

    // Fan out to all enrolled students as AppNotification
    const enrollments = await db.enrollment.findMany({
      where: { courseId: values.courseId },
      select: { userId: true }
    });

    if (enrollments.length > 0) {
      const courseTitle = course.titleEn || course.titlePs || "Your course";
      await db.appNotification.createMany({
        data: enrollments.map((e) => ({
          userId: e.userId,
          kind: "GENERAL" as const,
          title: `New announcement in "${courseTitle}"`,
          body: values.body.slice(0, 120),
          link: `/courses/${values.courseId}#announcements`
        }))
      });
    }

    revalidatePath("/educator");
    revalidatePath(`/courses/${values.courseId}`);
    if (course.slug) revalidatePath(`/courses/${course.slug}`);
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input." };
    if (e instanceof Error) return { ok: false, error: e.message };
    return { ok: false, error: "Something went wrong." };
  }
}

export async function getCourseAnnouncements(courseId: string) {
  return db.courseAnnouncement.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, title: true, body: true, createdAt: true }
  }).catch(() => []);
}
