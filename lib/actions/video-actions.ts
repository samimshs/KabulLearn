"use server";

import { LessonType, ProgressStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCourseEnrollment, assertRateLimit, signHeartbeat } from "@/lib/security";
import { createCertificateIfEligible } from "@/lib/actions/certificate-actions";
import { updateUserStreak } from "@/lib/actions/streak-actions";

const lessonRefSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1)
});

/**
 * Marks a lesson as IN_PROGRESS when it's first opened.
 * Never downgrades a COMPLETED lesson (upsert update is a no-op).
 */
export async function markLessonInProgress(input: z.infer<typeof lessonRefSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };

  const values = lessonRefSchema.parse(input);
  await assertCourseEnrollment({ userId: session.user.id, courseId: values.courseId });
  const lesson = await db.lesson.findUnique({
    where: { id: values.lessonId },
    select: { type: true, module: { select: { courseId: true } } }
  });
  if (!lesson || lesson.module.courseId !== values.courseId) return { ok: false as const };
  // Quizzes track their own completion via the quiz flow — never touch them here.
  if (lesson.type === LessonType.QUIZ) return { ok: false as const };

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: values.lessonId } },
    create: { userId: session.user.id, lessonId: values.lessonId, status: ProgressStatus.IN_PROGRESS },
    update: {} // keep existing status — never downgrade COMPLETED
  });

  return { ok: true as const };
}

const completeReadingSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1)
});

export async function completeReadingLesson(input: z.infer<typeof completeReadingSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Authentication required.");

  const values = completeReadingSchema.parse(input);
  await assertCourseEnrollment({ userId: session.user.id, courseId: values.courseId });
  const lesson = await db.lesson.findUnique({
    where: { id: values.lessonId },
    select: { type: true, moduleId: true, module: { select: { courseId: true } } }
  });

  if (!lesson || lesson.type !== LessonType.READING || lesson.module.courseId !== values.courseId) {
    throw new Error("Invalid reading lesson.");
  }

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: values.lessonId } },
    create: { userId: session.user.id, lessonId: values.lessonId, status: ProgressStatus.COMPLETED, completedAt: new Date(), attempts: 1 },
    update: { status: ProgressStatus.COMPLETED, completedAt: new Date(), attempts: { increment: 1 } }
  });

  // Issue the certificate if this was the final lesson needed
  await createCertificateIfEligible(values.courseId, session.user.id).catch(() => null);
  void updateUserStreak(session.user.id);

  revalidatePath(`/courses/${values.courseId}`);
  revalidatePath(`/courses/${values.courseId}/certificate`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/dashboard/my-courses`);
  return { ok: true };
}

const heartbeatSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  positionSec: z.number().finite().nonnegative(),
  durationSec: z.number().finite().positive()
});

const completeVideoSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  heartbeatId: z.string().min(1),
  signature: z.string().min(20)
});

export async function recordVideoHeartbeat(input: z.infer<typeof heartbeatSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  if (session.user.status === "VERIFICATION_PENDING") {
    throw new Error("Verify your email before continuing.");
  }

  await assertRateLimit(`video:${session.user.id}:${input.lessonId}`, 120);

  const values = heartbeatSchema.parse(input);
  await assertCourseEnrollment({ userId: session.user.id, courseId: values.courseId });
  const lesson = await db.lesson.findUnique({
    where: { id: values.lessonId },
    select: {
      id: true,
      type: true,
      moduleId: true,
      module: { select: { courseId: true } }
    }
  });

  if (!lesson || lesson.type !== LessonType.VIDEO || lesson.module.courseId !== values.courseId) {
    throw new Error("Invalid video lesson.");
  }

  const consumedPct = Math.min(100, Math.max(0, (values.positionSec / values.durationSec) * 100));
  const signature = signHeartbeat({
    userId: session.user.id,
    lessonId: values.lessonId,
    courseId: values.courseId,
    positionSec: values.positionSec,
    durationSec: values.durationSec,
    consumedPct
  });

  const heartbeat = await db.lessonHeartbeat.create({
    data: {
      userId: session.user.id,
      lessonId: values.lessonId,
      courseId: values.courseId,
      positionSec: values.positionSec,
      durationSec: values.durationSec,
      consumedPct,
      signature
    },
    select: { id: true, signature: true, consumedPct: true }
  });

  return heartbeat;
}

export async function completeVideoLesson(input: z.infer<typeof completeVideoSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  if (session.user.status === "VERIFICATION_PENDING") {
    throw new Error("Verify your email before continuing.");
  }

  await assertRateLimit(`complete-video:${session.user.id}:${input.lessonId}`, 20);

  const values = completeVideoSchema.parse(input);
  await assertCourseEnrollment({ userId: session.user.id, courseId: values.courseId });
  const heartbeat = await db.lessonHeartbeat.findUnique({
    where: { id: values.heartbeatId },
    select: {
      id: true,
      userId: true,
      lessonId: true,
      courseId: true,
      positionSec: true,
      durationSec: true,
      consumedPct: true,
      signature: true,
      createdAt: true,
      lesson: {
        select: {
          type: true,
          moduleId: true,
          module: { select: { courseId: true } }
        }
      }
    }
  });

  if (
    !heartbeat ||
    heartbeat.userId !== session.user.id ||
    heartbeat.lessonId !== values.lessonId ||
    heartbeat.courseId !== values.courseId ||
    heartbeat.signature !== values.signature ||
    heartbeat.consumedPct < 90 ||
    heartbeat.lesson.type !== LessonType.VIDEO ||
    heartbeat.lesson.module.courseId !== values.courseId
  ) {
    throw new Error("Watch at least 90% of the video before completing this lesson.");
  }

  const expectedSignature = signHeartbeat({
    userId: heartbeat.userId,
    lessonId: heartbeat.lessonId,
    courseId: heartbeat.courseId,
    positionSec: heartbeat.positionSec,
    durationSec: heartbeat.durationSec,
    consumedPct: heartbeat.consumedPct
  });

  if (expectedSignature !== values.signature) {
    throw new Error("Invalid playback heartbeat.");
  }

  // Lessons can be completed in any order — module gating is open in the UI,
  // and the certificate just requires everything done (order-independent).

  await db.userProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId: values.lessonId
      }
    },
    create: {
      userId: session.user.id,
      lessonId: values.lessonId,
      status: ProgressStatus.COMPLETED,
      completedAt: new Date(),
      attempts: 1
    },
    update: {
      status: ProgressStatus.COMPLETED,
      completedAt: new Date(),
      attempts: { increment: 1 }
    }
  });

  // Issue the certificate if this was the final lesson needed
  await createCertificateIfEligible(values.courseId, session.user.id).catch(() => null);
  void updateUserStreak(session.user.id);

  revalidatePath(`/courses/${values.courseId}`);
  revalidatePath(`/courses/${values.courseId}/certificate`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/dashboard/my-courses`);

  return { ok: true };
}
