"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  lessonId: z.string().min(1),
  body: z.string().max(5000)
});

export async function upsertLessonNote(input: { lessonId: string; body: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };

  const { lessonId, body } = schema.parse(input);

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

  const note = await db.lessonNote.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    select: { body: true }
  }).catch(() => null);

  return note?.body ?? "";
}
