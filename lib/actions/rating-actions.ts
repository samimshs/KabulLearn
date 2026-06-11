"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCourseCertificateStatus } from "@/lib/actions/certificate-actions";
import { assertCourseEnrollment } from "@/lib/security";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ratingSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional()
});

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong." };
}

export async function submitCourseRating(input: z.infer<typeof ratingSchema>): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Authentication required.");

    const values = ratingSchema.parse(input);
    await assertCourseEnrollment({ userId: session.user.id, courseId: values.courseId });

    const certificateStatus = await getCourseCertificateStatus(values.courseId, session.user.id);
    if (!certificateStatus) throw new Error("Course not found.");

    if (!certificateStatus.eligible) {
      throw new Error("Finish the course before rating it.");
    }

    await db.courseRating.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: values.courseId
        }
      },
      update: {
        rating: values.rating,
        comment: values.comment || null
      },
      create: {
        userId: session.user.id,
        courseId: values.courseId,
        rating: values.rating,
        comment: values.comment || null
      }
    });

    revalidatePath(`/courses/${values.courseId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
