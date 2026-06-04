"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const createThreadSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(3).max(3000)
});

const createReplySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(2).max(3000)
});

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  }
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong." };
}

export async function createDiscussionThread(input: z.infer<typeof createThreadSchema>): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Authentication required.");
    const values = createThreadSchema.parse(input);

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: values.courseId } }
    });
    if (!enrollment) throw new Error("Enroll in the course before joining the discussion.");

    await db.discussionThread.create({
      data: {
        courseId: values.courseId,
        authorId: session.user.id,
        title: values.title,
        body: values.body
      }
    });

    revalidatePath(`/courses/${values.courseId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createDiscussionReply(input: z.infer<typeof createReplySchema>): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Authentication required.");
    const values = createReplySchema.parse(input);

    const thread = await db.discussionThread.findUnique({
      where: { id: values.threadId },
      select: { courseId: true }
    });
    if (!thread) throw new Error("Discussion not found.");

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: thread.courseId } }
    });
    if (!enrollment) throw new Error("Enroll in the course before replying.");

    await db.discussionReply.create({
      data: {
        threadId: values.threadId,
        authorId: session.user.id,
        body: values.body
      }
    });

    revalidatePath(`/courses/${thread.courseId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
