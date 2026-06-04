import { CourseStatus, LessonType, ProgressStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

export type CourseCertificateStatus = {
  courseId: string;
  courseTitleEn: string;
  courseTitlePs: string;
  eligible: boolean;
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
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      titleEn: true,
      titlePs: true,
      status: true,
      publishedAt: true,
      modules: {
        orderBy: [{ order: "asc" }],
        select: {
          lessons: {
            where: { type: LessonType.QUIZ },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
    return null;
  }

  // All quiz lesson IDs in this course
  const quizLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const requiredQuizzes = quizLessonIds.length;

  const completedProgress = requiredQuizzes
    ? await db.userProgress.findMany({
        where: {
          userId,
          status: ProgressStatus.COMPLETED,
          lessonId: { in: quizLessonIds }
        },
        select: { lessonId: true, latestScore: true }
      })
    : [];

  const certificate = await db.certificate.findFirst({
    where: { courseId, userId }
  });
  const completedQuizzes = new Set(completedProgress.map((p) => p.lessonId)).size;
  const hasCertificate = Boolean(certificate);
  const eligible = hasCertificate || (requiredQuizzes > 0 && completedQuizzes === requiredQuizzes);
  const grade = certificate
    ? Math.round(certificate.grade)
    : eligible && completedProgress.length > 0
    ? Math.round(
        completedProgress.reduce((sum, p) => sum + (p.latestScore ?? 0), 0) /
        completedProgress.length
      )
    : 0;

  return {
    courseId: course.id,
    courseTitleEn: course.titleEn,
    courseTitlePs: course.titlePs,
    eligible,
    completedQuizzes,
    requiredQuizzes,
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

  const certificate = await db.certificate.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { grade: status.grade },
    create: { userId, courseId, grade: status.grade, verificationCode: randomUUID() }
  });

  return {
    ...status,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.verificationCode,
    certificateUuid: certificate.uuid,
    hasCertificate: true
  };
}
