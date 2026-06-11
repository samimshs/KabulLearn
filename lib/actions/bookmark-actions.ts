"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCourseEnrollment } from "@/lib/security";

export async function getLessonBookmark(lessonId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;

  const bookmark = await db.lessonBookmark.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    select: { id: true }
  }).catch(() => null);

  return Boolean(bookmark);
}

export async function toggleLessonBookmark(input: { lessonId: string; bookmarked: boolean }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Authentication required." };
  }

  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    select: { id: true, module: { select: { courseId: true } } }
  });
  if (!lesson) {
    return { ok: false, error: "Lesson not found." };
  }

  try {
    await assertCourseEnrollment({ userId: session.user.id, courseId: lesson.module.courseId });
    if (input.bookmarked) {
      await db.lessonBookmark.upsert({
        where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
        create: { userId: session.user.id, lessonId: lesson.id },
        update: {}
      });
    } else {
      await db.lessonBookmark.deleteMany({
        where: { userId: session.user.id, lessonId: lesson.id }
      });
    }
    revalidatePath(`/courses/${lesson.module.courseId}/lessons/${lesson.id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update bookmark." };
  }
}
