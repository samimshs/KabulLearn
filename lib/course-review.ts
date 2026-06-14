import { revalidatePath } from "next/cache";
import { CourseStatus } from "@prisma/client";
import { db } from "@/lib/db";

// When an educator edits content on a submitted/published course, drop it back
// to DRAFT so they must explicitly re-submit for admin review.
// publishedAt is cleared so unapproved content cannot be served publicly.
export async function sendCourseBackToReview(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, status: true, publishedAt: true }
  });

  if (!course || (course.status === CourseStatus.DRAFT && !course.publishedAt)) {
    return;
  }

  await db.course.update({
    where: { id: courseId },
    data: {
      status: CourseStatus.DRAFT,
      submittedAt: null,
      publishedAt: null
    }
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${course.id}`);
  if (course.slug) revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/dashboard");
}
