import { revalidatePath } from "next/cache";
import { CourseStatus } from "@prisma/client";
import { db } from "@/lib/db";

// When an educator edits content on a submitted/published course, we need to
// queue it for re-review. Two distinct cases:
//
// 1. Previously PUBLISHED (publishedAt is set): keep the course live for students
//    (status → PENDING_REVIEW, publishedAt preserved) so enrolled learners never
//    lose access. Admin reviews and re-approves before the new content is
//    considered officially published.
//
// 2. First-time PENDING_REVIEW (never published, publishedAt is null): kick back
//    to DRAFT so the educator must re-submit once edits are finalised.
export async function sendCourseBackToReview(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, status: true, publishedAt: true }
  });

  if (!course) return;

  // Already in a plain editable draft — nothing to do.
  if (course.status === CourseStatus.DRAFT && !course.publishedAt) return;

  // Already in "live-pending" state — content is live, admin review is queued.
  if (course.status === CourseStatus.PENDING_REVIEW && course.publishedAt) return;

  const wasPreviouslyPublished = Boolean(course.publishedAt);

  if (wasPreviouslyPublished) {
    // Move to PENDING_REVIEW but keep publishedAt so students retain access.
    await db.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PENDING_REVIEW, submittedAt: null }
    });
  } else {
    // First-time submission that was edited mid-review — back to DRAFT.
    await db.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.DRAFT, submittedAt: null, publishedAt: null }
    });
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${course.id}`);
  if (course.slug) revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/dashboard");
}
