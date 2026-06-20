"use server";

import { revalidatePath } from "next/cache";
import { CourseStatus, LessonType, ReviewEventType, UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendCourseBackToReview } from "@/lib/course-review";
import { AuthorizationError, canManageCourse, requireAdmin, requireEducator } from "@/lib/rbac";
import { writeAdminAudit } from "@/lib/admin-audit";
import {
  courseIdSchema,
  createCourseDbSchema,
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  lessonIdSchema,
  moduleIdSchema,
  updateCourseDbSchema,
  updateCourseSchema,
  type CreateCourseInput,
  type CreateLessonInput,
  type CreateModuleInput,
  type UpdateCourseInput as UpdateCourseInputType
} from "@/lib/validators/course";

export type ActionResult<T = void> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }

  return { ok: false, error: "Something went wrong." };
}

function normalizedOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function courseContentChanged(
  previous: {
    titleEn: string;
    titlePs: string;
    titleDa: string | null;
    descriptionEn: string;
    descriptionPs: string;
    descriptionDa: string | null;
  },
  next: {
    titleEn: string;
    titlePs: string;
    titleDa?: string;
    descriptionEn: string;
    descriptionPs: string;
    descriptionDa?: string;
  }
) {
  return (
    previous.titleEn !== next.titleEn ||
    previous.titlePs !== next.titlePs ||
    normalizedOptionalText(previous.titleDa) !== normalizedOptionalText(next.titleDa) ||
    previous.descriptionEn !== next.descriptionEn ||
    previous.descriptionPs !== next.descriptionPs ||
    normalizedOptionalText(previous.descriptionDa) !== normalizedOptionalText(next.descriptionDa)
  );
}

const reorderModulesSchema = z.object({
  courseId: z.string().min(1),
  moduleIds: z.array(z.string().min(1)).min(1, "Add at least one module before ordering.")
});

const reorderLessonsSchema = z.object({
  moduleId: z.string().min(1),
  lessonIds: z.array(z.string().min(1)).min(1, "Add at least one lesson before ordering.")
});

function assertSameIds(expectedIds: string[], submittedIds: string[], label: string) {
  const expected = new Set(expectedIds);
  const submitted = new Set(submittedIds);

  if (expected.size !== submitted.size || expectedIds.length !== submittedIds.length) {
    throw new Error(`${label} order must include every existing item exactly once.`);
  }

  for (const id of submittedIds) {
    if (!expected.has(id)) {
      throw new Error(`${label} order contains an item that does not belong here.`);
    }
  }
}

async function upsertCreatorProfile(input: {
  creatorId: string;
  profile: {
    username: string;
    name: string;
    professionalTitle?: string;
    professionalTitlePs?: string;
    professionalTitleDa?: string;
    bio?: string;
    bioPs?: string;
    bioDa?: string;
    avatarUrl?: string;
    linkedinUrl?: string;
    youtubeUrl?: string;
  };
}) {
  const existing = await db.creatorProfile.findUnique({
    where: { username: input.profile.username },
    select: { id: true, createdById: true }
  });

  if (existing && existing.createdById !== input.creatorId) {
    // Profile belongs to another creator — link to it without modifying it
    return existing.id;
  }

  const profileData = {
    name: input.profile.name,
    professionalTitle: input.profile.professionalTitle || null,
    professionalTitlePs: input.profile.professionalTitlePs || null,
    professionalTitleDa: input.profile.professionalTitleDa || null,
    bio: input.profile.bio || null,
    bioPs: input.profile.bioPs || null,
    bioDa: input.profile.bioDa || null,
    avatarUrl: input.profile.avatarUrl || null,
    linkedinUrl: input.profile.linkedinUrl || null,
    youtubeUrl: input.profile.youtubeUrl || null,
  };

  const profile = await db.creatorProfile.upsert({
    where: { username: input.profile.username },
    update: profileData,
    create: { username: input.profile.username, createdById: input.creatorId, ...profileData },
    select: { id: true }
  });

  return profile.id;
}

export async function createCourse(input: CreateCourseInput): Promise<ActionResult<{ courseId: string }>> {
  try {
    const educator = await requireEducator();
    const parsed = createCourseDbSchema.parse(input);

    const course = await db.course.create({
      data: { ...parsed.course, authorId: educator.id, status: CourseStatus.DRAFT },
      select: { id: true }
    });

    const profileIds: string[] = [];
    for (const inst of parsed.instructors) {
      const profileId = await upsertCreatorProfile({
        creatorId: educator.id,
        profile: {
          username: inst.username,
          name: inst.name,
          professionalTitle: inst.title,
          professionalTitlePs: inst.titlePs,
          professionalTitleDa: inst.titleDa,
          bio: inst.bio,
          bioPs: inst.bioPs,
          bioDa: inst.bioDa,
          avatarUrl: inst.avatarUrl,
          linkedinUrl: inst.linkedinUrl,
          youtubeUrl: inst.youtubeUrl,
        }
      });
      profileIds.push(profileId);
    }

    await db.courseInstructor.createMany({
      data: profileIds.map((profileId, order) => ({ courseId: course.id, profileId, order }))
    });

    await db.course.update({
      where: { id: course.id },
      data: { authorProfileId: profileIds[0] ?? null }
    });

    revalidatePath("/educator");
    return { ok: true, data: { courseId: course.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function submitCourseForReview(input: { courseId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const { courseId } = courseIdSchema.parse(input);

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        authorId: true,
        status: true,
        modules: {
          select: {
            titleEn: true,
            lessons: {
              select: {
                type: true,
                titleEn: true,
                youtubeUrl: true,
                readingEn: true,
                readingPs: true,
                quiz: {
                  select: {
                    questions: {
                      select: {
                        id: true,
                        type: true,
                        correctAnswer: true,
                        choices: {
                          select: {
                            isCorrect: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new Error("Course not found.");
    }

    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    if (course.status !== CourseStatus.DRAFT) {
      throw new Error("Only draft courses can be submitted for review.");
    }

    if (course.modules.length === 0) {
      throw new Error("Add at least one module before submitting for review.");
    }

    const allLessons = course.modules.flatMap((module) => module.lessons);
    if (allLessons.length === 0) {
      throw new Error("Add at least one lesson before submitting for review.");
    }

    const incompleteLesson = allLessons.find((lesson) => {
      if (lesson.type === LessonType.VIDEO) return !lesson.youtubeUrl;
      if (lesson.type === LessonType.READING) return !lesson.readingEn && !lesson.readingPs;
      if (lesson.type === LessonType.QUIZ) {
        if (!lesson.quiz || lesson.quiz.questions.length === 0) return true;
        // Questions with no choices are AI generation artifacts — skip them when checking
        const checkableQuestions = lesson.quiz.questions.filter(
          (q) => q.type === "TEXT_INPUT" || q.choices.length > 0
        );
        if (checkableQuestions.length === 0) return true; // all questions are empty artifacts
        return checkableQuestions.some((question) => {
          if (question.type === "TEXT_INPUT") return !question.correctAnswer;
          return !question.choices.some((choice) => choice.isCorrect);
        });
      }
      return false;
    });

    if (incompleteLesson) {
      throw new Error(`Complete the ${incompleteLesson.titleEn} lesson before submitting for review.`);
    }

    await db.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PENDING_REVIEW,
        submittedAt: new Date(),
        reviewNote: null
      }
    });

    await db.courseReviewEvent.create({
      data: {
        courseId,
        actorId: educator.id,
        type: ReviewEventType.SUBMITTED,
        note: "Course submitted for admin review."
      }
    });

    revalidatePath("/educator");
    revalidatePath(`/educator/courses/${courseId}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function publishCourse(input: { courseId: string }): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { courseId } = courseIdSchema.parse(input);

    if (admin.role !== UserRole.ADMIN) {
      throw new AuthorizationError();
    }

    const course = await db.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        reviewNote: null
      },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        author: { select: { email: true } }
      }
    });

    await db.courseReviewEvent.create({
      data: {
        courseId,
        actorId: admin.id,
        type: ReviewEventType.PUBLISHED,
        note: "Course published."
      }
    });
    await writeAdminAudit({
      actorId: admin.id,
      action: "course.publish",
      targetId: courseId,
      targetType: "Course",
      metadata: { title: course.titleEn }
    });
    await db.notificationLog.create({
      data: {
        email: course.author.email,
        subject: `KabulLearn course published: ${course.titleEn}`,
        body: `Your course "${course.titleEn}" has been published.`
      }
    });

    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.id}`);
    if (course.slug) revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/admin");
    revalidatePath("/educator");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

const rejectCourseSchema = z.object({
  courseId: z.string().cuid(),
  reviewNote: z.string().trim().min(5, "Return reason must be at least 5 characters.").max(2000)
});

export async function rejectCourse(input: { courseId: string; reviewNote: string }): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { courseId, reviewNote } = rejectCourseSchema.parse(input);

    if (admin.role !== UserRole.ADMIN) {
      throw new AuthorizationError();
    }

    const course = await db.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.DRAFT,
        submittedAt: null,
        publishedAt: null,
        reviewNote
      },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        author: { select: { email: true } }
      }
    });

    await db.courseReviewEvent.create({
      data: {
        courseId,
        actorId: admin.id,
        type: ReviewEventType.RETURNED,
        note: reviewNote
      }
    });
    await writeAdminAudit({
      actorId: admin.id,
      action: "course.reject",
      targetId: courseId,
      targetType: "Course",
      metadata: { title: course.titleEn }
    });
    await db.notificationLog.create({
      data: {
        email: course.author.email,
        subject: `KabulLearn course returned: ${course.titleEn}`,
        body: reviewNote
      }
    });

    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.id}`);
    if (course.slug) revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/admin");
    revalidatePath("/educator");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateModule(input: CreateModuleInput & { moduleId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = createModuleSchema.extend({ moduleId: z.string().cuid() }).parse(input);
    const module = await db.module.findUnique({
      where: { id: values.moduleId },
      select: { course: { select: { id: true, authorId: true } } }
    });

    if (!module) throw new Error("Module not found.");
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: module.course.authorId })) {
      throw new AuthorizationError();
    }

    await db.module.update({
      where: { id: values.moduleId },
      data: {
        titleEn: values.titleEn,
        titlePs: values.titlePs,
        titleDa: values.titleDa,
        descriptionEn: values.descriptionEn,
        descriptionPs: values.descriptionPs,
        descriptionDa: values.descriptionDa
      }
    });
    await sendCourseBackToReview(module.course.id);
    revalidatePath(`/educator/courses/${module.course.id}`);
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLesson(input: CreateLessonInput & { lessonId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = createLessonSchema.extend({ lessonId: z.string().cuid() }).parse(input);
    const lesson = await db.lesson.findUnique({
      where: { id: values.lessonId },
      select: { type: true, module: { select: { id: true, course: { select: { id: true, authorId: true } } } } }
    });

    if (!lesson) throw new Error("Lesson not found.");
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: lesson.module.course.authorId })) {
      throw new AuthorizationError();
    }
    if (lesson.module.id !== values.moduleId) throw new Error("Invalid lesson module.");
    if (lesson.type !== values.type) throw new Error("Lesson type cannot be changed after creation.");

    await db.lesson.update({
      where: { id: values.lessonId },
      data: {
        titleEn: values.titleEn,
        titlePs: values.titlePs,
        titleDa: values.titleDa,
        descriptionEn: values.descriptionEn,
        descriptionPs: values.descriptionPs,
        descriptionDa: values.descriptionDa,
        youtubeUrl: values.type === LessonType.VIDEO ? values.youtubeUrl : null,
        readingEn: values.type === LessonType.READING ? values.readingEn : null,
        readingPs: values.type === LessonType.READING ? values.readingPs : null,
        readingDa: values.type === LessonType.READING ? values.readingDa : null,
        isFinalTest: values.type === LessonType.QUIZ ? values.isFinalTest ?? false : false,
        passingScore: values.type === LessonType.QUIZ ? values.passingScore ?? 70 : values.passingScore
      }
    });
    await sendCourseBackToReview(lesson.module.course.id);
    revalidatePath(`/educator/courses/${lesson.module.course.id}`);
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCourse(input: UpdateCourseInputType): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = updateCourseDbSchema.parse(input);

    const course = await db.course.findUnique({
      where: { id: values.course.courseId },
      select: {
        authorId: true,
        titleEn: true,
        titlePs: true,
        titleDa: true,
        descriptionEn: true,
        descriptionPs: true,
        descriptionDa: true
      }
    });

    if (!course) throw new Error("Course not found.");
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    // Upsert all instructor profiles and rebuild junction rows
    const profileIds: string[] = [];
    for (const inst of values.instructors) {
      const profile = await upsertCreatorProfile({
        creatorId: educator.id,
        profile: {
          username: inst.username,
          name: inst.name,
          professionalTitle: inst.title,
          professionalTitlePs: inst.titlePs,
          professionalTitleDa: inst.titleDa,
          bio: inst.bio,
          bioPs: inst.bioPs,
          bioDa: inst.bioDa,
          avatarUrl: inst.avatarUrl,
          linkedinUrl: inst.linkedinUrl,
          youtubeUrl: inst.youtubeUrl,
        }
      });
      profileIds.push(profile);
    }

    await db.courseInstructor.deleteMany({ where: { courseId: values.course.courseId } });
    await db.courseInstructor.createMany({
      data: profileIds.map((profileId, order) => ({ courseId: values.course.courseId, profileId, order }))
    });

    await db.course.update({
      where: { id: values.course.courseId },
      data: {
        slug: values.course.slug,
        level: values.course.level || null,
        titleEn: values.course.titleEn,
        titlePs: values.course.titlePs,
        titleDa: values.course.titleDa,
        descriptionEn: values.course.descriptionEn,
        descriptionPs: values.course.descriptionPs,
        descriptionDa: values.course.descriptionDa,
        isPaid: values.course.isPaid,
        priceCents: values.course.priceCents,
        currency: values.course.currency,
        authorProfileId: profileIds[0] ?? null
      }
    });

    if (courseContentChanged(course, values.course)) {
      await sendCourseBackToReview(values.course.courseId);
    }

    revalidatePath("/educator");
    revalidatePath(`/educator/courses/${values.course.courseId}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCourse(input: { courseId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const { courseId } = courseIdSchema.parse(input);

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { authorId: true, id: true }
    });

    if (!course) {
      throw new Error("Course not found.");
    }

    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    await db.course.delete({
      where: { id: courseId }
    });

    revalidatePath("/educator");
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createModule(input: CreateModuleInput): Promise<ActionResult<{ moduleId: string }>> {
  try {
    const educator = await requireEducator();
    const values = createModuleSchema.parse(input);

    const course = await db.course.findUnique({
      where: { id: values.courseId },
      select: { authorId: true }
    });

    if (!course) {
      throw new Error("Course not found.");
    }

    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    const moduleOrder = (await db.module.aggregate({
      where: { courseId: values.courseId },
      _max: { order: true }
    }))._max.order ?? 0;

    const module = await db.module.create({
      data: {
        courseId: values.courseId,
        titleEn: values.titleEn,
        titlePs: values.titlePs,
        titleDa: values.titleDa,
        descriptionEn: values.descriptionEn,
        descriptionPs: values.descriptionPs,
        descriptionDa: values.descriptionDa,
        order: moduleOrder + 1
      },
      select: { id: true }
    });

    await sendCourseBackToReview(values.courseId);

    revalidatePath(`/educator/courses/${values.courseId}`);
    revalidatePath("/admin");

    return { ok: true, data: { moduleId: module.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteModule(input: { moduleId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const { moduleId } = moduleIdSchema.parse(input);

    const module = await db.module.findUnique({
      where: { id: moduleId },
      select: { course: { select: { authorId: true, id: true } } }
    });

    if (!module) {
      throw new Error("Module not found.");
    }

    if (!canManageCourse({
      requesterId: educator.id,
      requesterRole: educator.role,
      authorId: module.course.authorId
    })) {
      throw new AuthorizationError();
    }

    await db.module.delete({ where: { id: moduleId } });

    await sendCourseBackToReview(module.course.id);

    revalidatePath(`/educator/courses/${module.course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createLesson(input: CreateLessonInput): Promise<ActionResult<{ lessonId: string }>> {
  try {
    const educator = await requireEducator();
    const values = createLessonSchema.parse(input);

    const module = await db.module.findUnique({
      where: { id: values.moduleId },
      select: { course: { select: { authorId: true, id: true } } }
    });

    if (!module) {
      throw new Error("Module not found.");
    }

    if (!canManageCourse({
      requesterId: educator.id,
      requesterRole: educator.role,
      authorId: module.course.authorId
    })) {
      throw new AuthorizationError();
    }

    const lessonOrder = (await db.lesson.aggregate({
      where: { moduleId: values.moduleId },
      _max: { order: true }
    }))._max.order ?? 0;

    const lesson = await db.lesson.create({
      data: {
        moduleId: values.moduleId,
        titleEn: values.titleEn,
        titlePs: values.titlePs,
        titleDa: values.titleDa,
        descriptionEn: values.descriptionEn,
        descriptionPs: values.descriptionPs,
        descriptionDa: values.descriptionDa,
        type: values.type,
        youtubeUrl: values.youtubeUrl,
        readingEn: values.readingEn,
        readingPs: values.readingPs,
        readingDa: values.readingDa,
        isFinalTest: values.isFinalTest ?? false,
        passingScore: values.passingScore ?? 70,
        order: lessonOrder + 1
      },
      select: { id: true }
    });

    if (values.type === LessonType.QUIZ) {
      await db.quiz.create({ data: { lessonId: lesson.id } });
    }

    await sendCourseBackToReview(module.course.id);

    revalidatePath(`/educator/courses/${module.course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: { lessonId: lesson.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteLesson(input: { lessonId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const { lessonId } = lessonIdSchema.parse(input);

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: {
            course: { select: { authorId: true, id: true } }
          }
        }
      }
    });

    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    if (!canManageCourse({
      requesterId: educator.id,
      requesterRole: educator.role,
      authorId: lesson.module.course.authorId
    })) {
      throw new AuthorizationError();
    }

    await db.lesson.delete({ where: { id: lessonId } });

    await sendCourseBackToReview(lesson.module.course.id);

    revalidatePath(`/educator/courses/${lesson.module.course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderModules(input: z.infer<typeof reorderModulesSchema>): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = reorderModulesSchema.parse(input);

    const course = await db.course.findUnique({
      where: { id: values.courseId },
      select: {
        id: true,
        authorId: true,
        modules: { select: { id: true } }
      }
    });

    if (!course) {
      throw new Error("Course not found.");
    }

    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    assertSameIds(course.modules.map((module) => module.id), values.moduleIds, "Module");

    await db.$transaction(async (tx) => {
      await Promise.all(
        values.moduleIds.map((id, index) =>
          tx.module.update({
            where: { id },
            data: { order: index + 10000 }
          })
        )
      );

      await Promise.all(
        values.moduleIds.map((id, index) =>
          tx.module.update({
            where: { id },
            data: { order: index + 1 }
          })
        )
      );
    });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath(`/educator/courses/${course.id}/preview`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderLessons(input: z.infer<typeof reorderLessonsSchema>): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = reorderLessonsSchema.parse(input);

    const module = await db.module.findUnique({
      where: { id: values.moduleId },
      select: {
        id: true,
        lessons: { select: { id: true } },
        course: { select: { id: true, authorId: true } }
      }
    });

    if (!module) {
      throw new Error("Module not found.");
    }

    if (!canManageCourse({
      requesterId: educator.id,
      requesterRole: educator.role,
      authorId: module.course.authorId
    })) {
      throw new AuthorizationError();
    }

    assertSameIds(module.lessons.map((lesson) => lesson.id), values.lessonIds, "Lesson");

    await db.$transaction(async (tx) => {
      await Promise.all(
        values.lessonIds.map((id, index) =>
          tx.lesson.update({
            where: { id },
            data: { order: index + 10000 }
          })
        )
      );

      await Promise.all(
        values.lessonIds.map((id, index) =>
          tx.lesson.update({
            where: { id },
            data: { order: index + 1 }
          })
        )
      );
    });

    await sendCourseBackToReview(module.course.id);

    revalidatePath(`/educator/courses/${module.course.id}`);
    revalidatePath(`/educator/courses/${module.course.id}/preview`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
