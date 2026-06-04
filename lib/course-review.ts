import { CourseStatus } from "@prisma/client";
import { db } from "@/lib/db";

// When an educator edits content on a submitted/published course, drop it back
// to DRAFT so they must explicitly re-submit for admin review.
// publishedAt is preserved so the course stays visible to students during editing.
export async function sendCourseBackToReview(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { status: true }
  });

  if (!course || course.status === CourseStatus.DRAFT) {
    return;
  }

  await db.course.update({
    where: { id: courseId },
    data: {
      status: CourseStatus.DRAFT,
      submittedAt: null
      // publishedAt intentionally NOT cleared — course stays visible to students
    }
  });
}
