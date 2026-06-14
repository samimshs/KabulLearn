"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCourseEnrollment } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  lessonId: z.string().min(1),
  body: z.string().max(5000)
});

async function canAccessLessonNotes(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      order: true,
      type: true,
      module: {
        select: {
          courseId: true,
          order: true,
          course: {
            select: {
              modules: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  order: true,
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, order: true, type: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  if (!lesson) return false;

  const enrolled = await assertCourseEnrollment({ userId, courseId: lesson.module.courseId })
    .then(() => true)
    .catch(() => false);
  if (enrolled) return true;

  const firstModule = lesson.module.course.modules[0];
  const previewLesson = firstModule?.lessons.find((item) => item.type !== "QUIZ");
  return previewLesson?.id === lesson.id;
}

export async function upsertLessonNote(input: { lessonId: string; body: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };

  const { lessonId, body } = schema.parse(input);
  const canAccess = await canAccessLessonNotes(session.user.id, lessonId);
  if (!canAccess) return { ok: false as const };

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
  const canAccess = await canAccessLessonNotes(session.user.id, lessonId).catch(() => false);
  if (!canAccess) return "";

  const note = await db.lessonNote.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    select: { body: true }
  }).catch(() => null);

  return note?.body ?? "";
}
