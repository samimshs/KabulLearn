"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LessonType, ProgressStatus, QuestionType } from "@prisma/client";
import { createCertificateIfEligible } from "@/lib/actions/certificate-actions";
import { assertPrecedingLessonsCompleted, assertRateLimit } from "@/lib/security";

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
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }

  return { ok: false, error: "Something went wrong." };
}

const quizSubmissionSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  lessonId: z.string().min(1),
  attemptId: z.string().min(1),
  selectedAnswers: z.array(
    z.object({
      questionId: z.string().min(1),
      answerChoiceIds: z.array(z.string().min(1)).optional(),
      textAnswer: z.string().optional()
    })
  )
});

const quizAttemptSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  lessonId: z.string().min(1)
});

export async function startQuizAttempt(
  input: z.infer<typeof quizAttemptSchema>
): Promise<ActionResult<{ attemptId: string; startedAt: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Authentication required.");
    if (session.user.status === "VERIFICATION_PENDING") throw new Error("Verify your email before continuing.");

    await assertRateLimit(`start-quiz:${session.user.id}:${input.lessonId}`, 20);

    const values = quizAttemptSchema.parse(input);
    const lesson = await db.lesson.findUnique({
      where: { id: values.lessonId },
      select: {
        type: true,
        moduleId: true,
        module: { select: { courseId: true } },
        quiz: { select: { questions: { select: { id: true } } } }
      }
    });

    if (
      !lesson ||
      lesson.type !== LessonType.QUIZ ||
      lesson.moduleId !== values.moduleId ||
      lesson.module.courseId !== values.courseId ||
      !lesson.quiz?.questions.length
    ) {
      throw new Error("Invalid quiz attempt.");
    }

    // Gate: every lesson preceding this quiz must be completed first
    await assertPrecedingLessonsCompleted({
      userId: session.user.id,
      courseId: values.courseId,
      lessonId: values.lessonId
    });

    const attempt = await db.quizAttemptSession.create({
      data: {
        userId: session.user.id,
        lessonId: values.lessonId,
        courseId: values.courseId,
        moduleId: values.moduleId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      select: { id: true, startedAt: true }
    });

    return { ok: true, data: { attemptId: attempt.id, startedAt: attempt.startedAt.toISOString() } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function submitQuizAttempt(
  input: z.infer<typeof quizSubmissionSchema>
): Promise<ActionResult<{ score: number; passed: boolean }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Authentication required.");
    }

    const { courseId, moduleId, lessonId, attemptId, selectedAnswers } = quizSubmissionSchema.parse(input);

    if (session.user.status === "VERIFICATION_PENDING") {
      throw new Error("Verify your email before continuing.");
    }

    await assertRateLimit(`submit-quiz:${session.user.id}:${lessonId}`, 12);

    const lesson = await db.lesson.findUnique({
      where: {
        id: lessonId
      },
      select: {
        moduleId: true,
        isFinalTest: true,
        passingScore: true,
        module: {
          select: {
            courseId: true,
            id: true
          }
        },
        quiz: {
          select: {
            questions: {
              orderBy: [{ order: "asc" }],
              select: {
                id: true,
                type: true,
                correctAnswer: true,
                choices: {
                  select: {
                    id: true,
                    isCorrect: true,
                    questionId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!lesson || !lesson.module || lesson.module.id !== moduleId || lesson.module.courseId !== courseId) {
      throw new Error("Invalid quiz route parameters.");
    }

    // Gate: every lesson preceding this quiz must be completed first
    await assertPrecedingLessonsCompleted({ userId: session.user.id, courseId, lessonId });

    const attempt = await db.quizAttemptSession.findUnique({
      where: { id: attemptId }
    });

    if (
      !attempt ||
      attempt.userId !== session.user.id ||
      attempt.lessonId !== lessonId ||
      attempt.courseId !== courseId ||
      attempt.moduleId !== moduleId ||
      attempt.usedAt ||
      attempt.expiresAt < new Date()
    ) {
      throw new Error("Start a fresh quiz attempt before submitting.");
    }

    const questions = lesson.quiz?.questions ?? [];

    if (questions.length === 0) {
      throw new Error("Quiz not found for this lesson.");
    }

    if (selectedAnswers.length !== questions.length) {
      throw new Error("Please answer every quiz question.");
    }

    const questionMap = new Map(
      questions.map((question) => [question.id, question])
    );

    let correctCount = 0;

    for (const selected of selectedAnswers) {
      const question = questionMap.get(selected.questionId);

      if (!question) {
        throw new Error("Invalid quiz question.");
      }

      if (question.type === QuestionType.TEXT_INPUT) {
        const submittedText = (selected.textAnswer ?? "").trim().replace(/\s+/g, " ").toLowerCase();
        const correctText = (question.correctAnswer ?? "").trim().replace(/\s+/g, " ").toLowerCase();

        if (!submittedText) {
          throw new Error("Please answer every quiz question.");
        }

        if (submittedText === correctText) {
          correctCount += 1;
        }

        continue;
      }

      const answerChoiceIds = selected.answerChoiceIds ?? [];
      if (answerChoiceIds.length === 0) {
        throw new Error("Please answer every quiz question.");
      }

      const choiceMap = new Map(question.choices.map((choice) => [choice.id, choice]));
      const selectedChoices = answerChoiceIds.map((answerChoiceId) => choiceMap.get(answerChoiceId));

      if (selectedChoices.some((choice) => !choice)) {
        throw new Error("Invalid answer choice.");
      }

      const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id).sort();
      const submittedChoiceIds = [...new Set(answerChoiceIds)].sort();

      if (
        correctChoiceIds.length === submittedChoiceIds.length &&
        correctChoiceIds.every((choiceId, index) => choiceId === submittedChoiceIds[index])
      ) {
        correctCount += 1;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passingScore = lesson.passingScore ?? 70;
    const passed = score >= passingScore;
    const durationMs = Date.now() - attempt.startedAt.getTime();

    const submissionAnswers: Array<{ questionId: string; answerChoiceId?: string; textAnswer?: string }> = [];
    for (const selected of selectedAnswers) {
      if (selected.textAnswer !== undefined) {
        submissionAnswers.push({
          questionId: selected.questionId,
          textAnswer: selected.textAnswer
        });
      } else {
        for (const answerChoiceId of selected.answerChoiceIds ?? []) {
          submissionAnswers.push({
            questionId: selected.questionId,
            answerChoiceId
          });
        }
      }
    }

    await db.$transaction(async (tx) => {
      await tx.quizAttemptSession.update({
        where: { id: attemptId },
        data: { usedAt: new Date() }
      });

      await tx.quizSubmission.create({
        data: {
          userId: session.user.id,
          lessonId,
          score,
          passed,
          startedAt: attempt.startedAt,
          durationMs,
          answers: {
            createMany: {
              data: submissionAnswers
            }
          }
        }
      });
    });

    const existingProgress = await db.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId
        }
      }
    });

    if (existingProgress) {
      const updatedStatus =
        existingProgress.status === ProgressStatus.COMPLETED
          ? ProgressStatus.COMPLETED
          : passed
          ? ProgressStatus.COMPLETED
          : ProgressStatus.IN_PROGRESS;

      await db.userProgress.update({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId
          }
        },
        data: {
          status: updatedStatus,
          completedAt:
            existingProgress.status === ProgressStatus.COMPLETED
              ? existingProgress.completedAt
              : passed
              ? new Date()
              : null,
          bestScore: Math.max(existingProgress.bestScore ?? 0, score),
          latestScore: score,
          attempts: existingProgress.attempts + 1
        }
      });
    } else {
      await db.userProgress.create({
        data: {
          userId: session.user.id,
          lessonId,
          status: passed ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
          completedAt: passed ? new Date() : null,
          bestScore: score,
          latestScore: score,
          attempts: 1
        }
      });
    }

    if (passed) {
      // Issue the certificate if this was the last requirement
      if (lesson.isFinalTest) {
        await createCertificateIfEligible(courseId, session.user.id).catch(() => null);
      }
      // Invalidate cached pages so the course/certificate reflect completion immediately
      revalidatePath(`/courses/${courseId}`);
      revalidatePath(`/courses/${courseId}/certificate`);
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/my-courses");
    }

    return {
      ok: true,
      data: {
        score,
        passed
      }
    };
  } catch (error) {
    return toActionError(error);
  }
}
