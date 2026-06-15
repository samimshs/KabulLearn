import { CourseStatus, LessonType, ProgressStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { assertCourseEnrollment } from "@/lib/security";
import { sendCertificateEmail } from "@/lib/email-verification";

export type CourseCertificateStatus = {
  courseId: string;
  courseTitleEn: string;
  courseTitlePs: string;
  eligible: boolean;
  // "completed/required" now reflect ALL lessons (video, reading, quiz), so a
  // course made entirely of videos/readings can still earn a certificate.
  completedQuizzes: number;
  requiredQuizzes: number;
  grade: number;
  issuedAt?: Date;
  verificationCode?: string;
  certificateUuid?: string;
  hasCertificate: boolean;
};

export async function getCourseCertificateStatus(
  courseId: string,
  userId: string
): Promise<CourseCertificateStatus | null> {
  const enrolled = await assertCourseEnrollment({ userId, courseId })
    .then(() => true)
    .catch(() => false);
  if (!enrolled) return null;
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      titleEn: true,
      titlePs: true,
      status: true,
      modules: {
        orderBy: [{ order: "asc" }],
        select: {
          lessons: {
            select: { id: true, type: true, isFinalTest: true }
          }
        }
      }
    }
  });

  if (!course || course.status !== CourseStatus.PUBLISHED) {
    return null;
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const quizLessonIds = allLessons.filter((l) => l.type === LessonType.QUIZ).map((l) => l.id);
  const finalExamIds = allLessons.filter((l) => l.type === LessonType.QUIZ && l.isFinalTest).map((l) => l.id);
  const contentLessonIds = allLessons.filter((l) => l.type !== LessonType.QUIZ).map((l) => l.id);

  // Certificate gate, in priority order:
  //  • Final Exam present → cert depends SOLELY on passing the final exam(s).
  //  • Else any quizzes → ALL module quizzes must be passed.
  //  • Else → completion of all content lessons (videos/readings).
  const hasQuizzes = quizLessonIds.length > 0;
  const requiredLessonIds =
    finalExamIds.length > 0 ? finalExamIds : hasQuizzes ? quizLessonIds : contentLessonIds;
  const requiredCount = requiredLessonIds.length;

  const completedProgress = requiredCount
    ? await db.userProgress.findMany({
        where: {
          userId,
          status: ProgressStatus.COMPLETED,
          lessonId: { in: requiredLessonIds }
        },
        select: { lessonId: true, latestScore: true }
      })
    : [];

  const certificate = await db.certificate.findFirst({
    where: { courseId, userId }
  });

  const completedCount = new Set(completedProgress.map((p) => p.lessonId)).size;
  const hasCertificate = Boolean(certificate);
  const eligible = hasCertificate || (requiredCount > 0 && completedCount >= requiredCount);

  // Grade: average of quiz scores when quizzes gate the course; otherwise a
  // completion-based 100% for video/reading-only courses.
  let grade: number;
  if (certificate) {
    grade = Math.round(certificate.grade);
  } else if (!eligible) {
    grade = 0;
  } else if (hasQuizzes) {
    grade = completedProgress.length > 0
      ? Math.round(completedProgress.reduce((sum, p) => sum + (p.latestScore ?? 0), 0) / completedProgress.length)
      : 0;
  } else {
    grade = 100;
  }

  return {
    courseId: course.id,
    courseTitleEn: course.titleEn,
    courseTitlePs: course.titlePs,
    eligible,
    completedQuizzes: completedCount,
    requiredQuizzes: requiredCount,
    grade,
    issuedAt: certificate?.issuedAt ?? undefined,
    verificationCode: certificate?.verificationCode ?? undefined,
    certificateUuid: certificate?.uuid ?? undefined,
    hasCertificate
  };
}

export async function createCertificateIfEligible(courseId: string, userId: string) {
  const status = await getCourseCertificateStatus(courseId, userId);
  if (!status || !status.eligible) return null;

  const isNewCertificate = !status.hasCertificate;

  const certificate = await db.certificate.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { grade: status.grade },
    create: { userId, courseId, grade: status.grade, verificationCode: randomUUID() }
  });

  if (isNewCertificate) {
    void sendCertificateEmail({
      userId,
      courseId,
      verificationCode: certificate.verificationCode,
      grade: certificate.grade,
    });
  }

  return {
    ...status,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.verificationCode,
    certificateUuid: certificate.uuid,
    hasCertificate: true
  };
}
