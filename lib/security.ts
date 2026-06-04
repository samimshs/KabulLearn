import { createHmac } from "crypto";
import { LessonType, ProgressStatus } from "@prisma/client";
import { db } from "@/lib/db";

function rateLimitWindowMs() {
  return 60_000;
}

export async function assertRateLimit(key: string, limit = 30) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + rateLimitWindowMs());

  const bucket = await db.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, resetAt },
    update: {
      count: { increment: 1 }
    }
  });

  if (bucket.resetAt < now) {
    await db.rateLimitBucket.update({
      where: { key },
      data: { count: 1, resetAt }
    });
    return;
  }

  if (bucket.count > limit) {
    throw new Error("Too many submissions. Please wait a moment and try again.");
  }
}

export function signHeartbeat(input: {
  userId: string;
  lessonId: string;
  courseId: string;
  positionSec: number;
  durationSec: number;
  consumedPct: number;
}) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "poharana-dev-secret";
  return createHmac("sha256", secret)
    .update([
      input.userId,
      input.lessonId,
      input.courseId,
      input.positionSec.toFixed(2),
      input.durationSec.toFixed(2),
      input.consumedPct.toFixed(2)
    ].join(":"))
    .digest("hex");
}

export async function assertPrerequisiteModulesCompleted(input: {
  userId: string;
  courseId: string;
  moduleId: string;
}) {
  const course = await db.course.findUnique({
    where: { id: input.courseId },
    select: {
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          lessons: {
            where: { type: LessonType.QUIZ },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!course) {
    throw new Error("Course not found.");
  }

  const current = course.modules.find((module) => module.id === input.moduleId);
  if (!current) {
    throw new Error("Module not found.");
  }

  const previousQuizLessonIds = course.modules
    .filter((module) => module.order < current.order)
    .flatMap((module) => module.lessons.map((lesson) => lesson.id));

  if (previousQuizLessonIds.length === 0) {
    return;
  }

  const completed = await db.userProgress.count({
    where: {
      userId: input.userId,
      lessonId: { in: previousQuizLessonIds },
      status: ProgressStatus.COMPLETED
    }
  });

  if (completed < previousQuizLessonIds.length) {
    throw new Error("Complete prerequisite module quizzes before submitting progress.");
  }
}

export async function getCourseProgress(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      modules: {
        select: {
          lessons: {
            where: { type: LessonType.QUIZ },
            select: { id: true }
          }
        }
      },
      certificates: {
        where: { userId },
        select: { id: true },
        take: 1
      }
    }
  });

  if (!course) {
    return { completed: 0, required: 0, percent: 0 };
  }

  const requiredLessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
  if (course.certificates.length > 0 && requiredLessonIds.length > 0) {
    return { completed: requiredLessonIds.length, required: requiredLessonIds.length, percent: 100 };
  }

  const completed = requiredLessonIds.length
    ? await db.userProgress.count({
        where: {
          userId,
          lessonId: { in: requiredLessonIds },
          status: ProgressStatus.COMPLETED
        }
      })
    : 0;

  const percent = requiredLessonIds.length ? Math.round((completed / requiredLessonIds.length) * 100) : 0;
  return { completed, required: requiredLessonIds.length, percent };
}
