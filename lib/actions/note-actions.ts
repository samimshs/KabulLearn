"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCourseEnrollment } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  lessonId: z.string().min(1),
  body: z.string().max(5000)
});

export async function upsertLessonNote(input: { lessonId: string; body: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };

  const { lessonId, body } = schema.parse(input);
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } }
  });
  if (!lesson) return { ok: false as const };
  await assertCourseEnrollment({ userId: session.user.id, courseId: lesson.module.courseId });

  if (!body.trim()) {
    await db.lessonNote.deleteMany({ where: { userId: session.user.id, lessonId } });
    return { ok: true as const };
  }

  await db.lessonNote.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, body },
    update: { body, updatedAt: new Date() }
  });

  return { ok: true as const };
}

export async function getLessonNote(lessonId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) return "";
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } }
  }).catch(() => null);
  if (!lesson) return "";
  const enrolled = await assertCourseEnrollment({ userId: session.user.id, courseId: lesson.module.courseId })
    .then(() => true)
    .catch(() => false);
  if (!enrolled) return "";

  const note = await db.lessonNote.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    select: { body: true }
  }).catch(() => null);

  return note?.body ?? "";
}
