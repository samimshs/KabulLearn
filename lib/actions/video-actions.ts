"use server";

import { LessonType, ProgressStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertPrerequisiteModulesCompleted, assertRateLimit, signHeartbeat } from "@/lib/security";

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

  await assertPrerequisiteModulesCompleted({
    userId: session.user.id,
    courseId: values.courseId,
    moduleId: heartbeat.lesson.moduleId
  });

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

  revalidatePath(`/courses/${values.courseId}`);
  revalidatePath(`/dashboard`);

  return { ok: true };
}
