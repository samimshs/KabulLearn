"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { CourseStatus } from "@prisma/client";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong." };
}

const enrollSchema = z.object({ courseId: z.string().min(1) });

export async function enrollInCourse(input: { courseId: string }): Promise<ActionResult<{ enrollmentId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("You must be signed in to enroll.");

    const { courseId } = enrollSchema.parse(input);

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { status: true, publishedAt: true }
    });

    if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
      throw new Error("Course not found or not available.");
    }

    const enrollment = await db.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: {},
      create: { userId: session.user.id, courseId }
    });

    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/dashboard");

    return { ok: true, data: { enrollmentId: enrollment.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getEnrollmentStatus(courseId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } }
  });

  return Boolean(enrollment);
}
