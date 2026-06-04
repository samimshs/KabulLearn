"use server";

import { revalidatePath } from "next/cache";
import { QuestionType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendCourseBackToReview } from "@/lib/course-review";
import { AuthorizationError, canManageCourse, requireEducator } from "@/lib/rbac";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong." };
}

const addQuestionSchema = z.object({
  lessonId: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  promptEn: z.string().min(1, "English prompt is required"),
  promptPs: z.string().min(1, "Pashto prompt is required"),
  correctAnswer: z.string().trim().optional(),
  explanationEn: z.string().optional(),
  explanationPs: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.type === QuestionType.TEXT_INPUT && !data.correctAnswer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["correctAnswer"],
      message: "Text or math-answer questions require the correct answer."
    });
  }
});

const addChoiceSchema = z.object({
  questionId: z.string().min(1),
  textEn: z.string().min(1, "English text is required"),
  textPs: z.string().min(1, "Pashto text is required"),
  isCorrect: z.boolean()
});

const reorderQuestionsSchema = z.object({
  lessonId: z.string().min(1),
  questionIds: z.array(z.string().min(1)).min(1, "Add at least one question before ordering.")
});

const reorderChoicesSchema = z.object({
  questionId: z.string().min(1),
  choiceIds: z.array(z.string().min(1)).min(1, "Add at least one answer choice before ordering.")
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

async function getCourseIdForLesson(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { course: { select: { id: true, authorId: true } } } } }
  });
  return lesson?.module.course ?? null;
}

async function getCourseIdForQuestion(questionId: string) {
  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { quiz: { select: { lesson: { select: { module: { select: { course: { select: { id: true, authorId: true } } } } } } } } }
  });
  return question?.quiz.lesson.module.course ?? null;
}

export async function addQuizQuestion(
  input: z.infer<typeof addQuestionSchema>
): Promise<ActionResult<{ questionId: string }>> {
  try {
    const educator = await requireEducator();
    const values = addQuestionSchema.parse(input);

    const quiz = await db.quiz.findUnique({
      where: { lessonId: values.lessonId },
      select: { id: true, lesson: { select: { module: { select: { course: { select: { id: true, authorId: true } } } } } } }
    });

    if (!quiz) throw new Error("Quiz not found for this lesson.");

    const course = quiz.lesson.module.course;
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    const maxOrder = (await db.question.aggregate({
      where: { quizId: quiz.id },
      _max: { order: true }
    }))._max.order ?? 0;

    const question = await db.question.create({
      data: {
        quizId: quiz.id,
        order: maxOrder + 1,
        type: values.type,
        promptEn: values.promptEn,
        promptPs: values.promptPs,
        correctAnswer: values.type === QuestionType.TEXT_INPUT ? values.correctAnswer : null,
        explanationEn: values.explanationEn,
        explanationPs: values.explanationPs
      },
      select: { id: true }
    });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}/quizzes/${values.lessonId}`);
    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: { questionId: question.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateQuizQuestion(input: {
  questionId: string;
  type: QuestionType;
  promptEn: string;
  promptPs: string;
  correctAnswer?: string;
  explanationEn?: string;
  explanationPs?: string;
}): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = addQuestionSchema.omit({ lessonId: true }).extend({ questionId: z.string().min(1) }).parse(input);

    const question = await db.question.findUnique({
      where: { id: values.questionId },
      select: {
        quiz: {
          select: {
            lessonId: true,
            lesson: { select: { module: { select: { course: { select: { id: true, authorId: true } } } } } }
          }
        }
      }
    });

    if (!question) throw new Error("Question not found.");
    const course = question.quiz.lesson.module.course;
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    await db.question.update({
      where: { id: values.questionId },
      data: {
        type: values.type,
        promptEn: values.promptEn,
        promptPs: values.promptPs,
        correctAnswer: values.type === QuestionType.TEXT_INPUT ? values.correctAnswer : null,
        explanationEn: values.explanationEn,
        explanationPs: values.explanationPs,
        choices: values.type === QuestionType.TEXT_INPUT ? { deleteMany: {} } : undefined
      }
    });

    await sendCourseBackToReview(course.id);
    revalidatePath(`/educator/courses/${course.id}/quizzes/${question.quiz.lessonId}`);
    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteQuizQuestion(input: { questionId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const { questionId } = z.object({ questionId: z.string().min(1) }).parse(input);

    const course = await getCourseIdForQuestion(questionId);
    if (!course) throw new Error("Question not found.");

    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    await db.question.delete({ where: { id: questionId } });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addAnswerChoice(
  input: z.infer<typeof addChoiceSchema>
): Promise<ActionResult<{ choiceId: string }>> {
  try {
    const educator = await requireEducator();
    const values = addChoiceSchema.parse(input);

    const question = await db.question.findUnique({
      where: { id: values.questionId },
      select: {
        type: true,
        quiz: {
          select: {
            lesson: {
              select: {
                module: {
                  select: {
                    course: { select: { id: true, authorId: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
    const course = question?.quiz.lesson.module.course;
    if (!course || !question) throw new Error("Question not found.");

    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    if (question.type === QuestionType.TEXT_INPUT) {
      throw new Error("Text or math-answer questions do not use answer choices.");
    }

    const maxOrder = (await db.answerChoice.aggregate({
      where: { questionId: values.questionId },
      _max: { order: true }
    }))._max.order ?? 0;

    if (question.type === QuestionType.SINGLE_CHOICE && values.isCorrect) {
      await db.answerChoice.updateMany({
        where: { questionId: values.questionId },
        data: { isCorrect: false }
      });
    }

    const choice = await db.answerChoice.create({
      data: {
        questionId: values.questionId,
        order: maxOrder + 1,
        textEn: values.textEn,
        textPs: values.textPs,
        isCorrect: values.isCorrect
      },
      select: { id: true }
    });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: { choiceId: choice.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAnswerChoice(
  input: z.infer<typeof addChoiceSchema> & { choiceId: string }
): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = addChoiceSchema.extend({ choiceId: z.string().min(1) }).parse(input);
    const choice = await db.answerChoice.findUnique({
      where: { id: values.choiceId },
      select: {
        questionId: true,
        question: {
          select: {
            type: true,
            quiz: { select: { lesson: { select: { module: { select: { course: { select: { id: true, authorId: true } } } } } } } }
          }
        }
      }
    });

    if (!choice || choice.questionId !== values.questionId) throw new Error("Answer choice not found.");
    const course = choice.question.quiz.lesson.module.course;
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }
    if (choice.question.type === QuestionType.TEXT_INPUT) throw new Error("Text questions do not use answer choices.");
    if (choice.question.type === QuestionType.SINGLE_CHOICE && values.isCorrect) {
      await db.answerChoice.updateMany({
        where: { questionId: values.questionId, id: { not: values.choiceId } },
        data: { isCorrect: false }
      });
    }

    await db.answerChoice.update({
      where: { id: values.choiceId },
      data: { textEn: values.textEn, textPs: values.textPs, isCorrect: values.isCorrect }
    });

    await sendCourseBackToReview(course.id);
    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteAnswerChoice(input: { choiceId: string }): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const { choiceId } = z.object({ choiceId: z.string().min(1) }).parse(input);

    const choice = await db.answerChoice.findUnique({
      where: { id: choiceId },
      select: { question: { select: { quiz: { select: { lesson: { select: { module: { select: { course: { select: { id: true, authorId: true } } } } } } } } } } }
    });

    if (!choice) throw new Error("Answer choice not found.");

    const course = choice.question.quiz.lesson.module.course;
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    await db.answerChoice.delete({ where: { id: choiceId } });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderQuizQuestions(input: z.infer<typeof reorderQuestionsSchema>): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = reorderQuestionsSchema.parse(input);

    const quiz = await db.quiz.findUnique({
      where: { lessonId: values.lessonId },
      select: {
        id: true,
        questions: { select: { id: true } },
        lesson: {
          select: {
            module: { select: { course: { select: { id: true, authorId: true } } } }
          }
        }
      }
    });

    if (!quiz) {
      throw new Error("Quiz not found.");
    }

    const course = quiz.lesson.module.course;
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    assertSameIds(quiz.questions.map((question) => question.id), values.questionIds, "Question");

    await db.$transaction(async (tx) => {
      await Promise.all(
        values.questionIds.map((id, index) =>
          tx.question.update({
            where: { id },
            data: { order: index + 10000 }
          })
        )
      );

      await Promise.all(
        values.questionIds.map((id, index) =>
          tx.question.update({
            where: { id },
            data: { order: index + 1 }
          })
        )
      );
    });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}/quizzes/${values.lessonId}`);
    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderAnswerChoices(input: z.infer<typeof reorderChoicesSchema>): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = reorderChoicesSchema.parse(input);

    const question = await db.question.findUnique({
      where: { id: values.questionId },
      select: {
        choices: { select: { id: true } },
        quiz: {
          select: {
            lessonId: true,
            lesson: {
              select: {
                module: { select: { course: { select: { id: true, authorId: true } } } }
              }
            }
          }
        }
      }
    });

    if (!question) {
      throw new Error("Question not found.");
    }

    const course = question.quiz.lesson.module.course;
    if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: course.authorId })) {
      throw new AuthorizationError();
    }

    assertSameIds(question.choices.map((choice) => choice.id), values.choiceIds, "Answer choice");

    await db.$transaction(async (tx) => {
      await Promise.all(
        values.choiceIds.map((id, index) =>
          tx.answerChoice.update({
            where: { id },
            data: { order: index + 10000 }
          })
        )
      );

      await Promise.all(
        values.choiceIds.map((id, index) =>
          tx.answerChoice.update({
            where: { id },
            data: { order: index + 1 }
          })
        )
      );
    });

    await sendCourseBackToReview(course.id);

    revalidatePath(`/educator/courses/${course.id}/quizzes/${question.quiz.lessonId}`);
    revalidatePath(`/educator/courses/${course.id}`);
    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
