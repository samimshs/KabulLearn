import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonType, ProgressStatus, QuestionType } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitQuizAttempt } from "@/lib/actions/quiz-actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/actions/certificate-actions", () => ({ createCertificateIfEligible: vi.fn() }));
vi.mock("@/lib/security", () => ({
  assertPrerequisiteModulesCompleted: vi.fn(),
  assertRateLimit: vi.fn()
}));
vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findUnique: vi.fn() },
    quizAttemptSession: { findUnique: vi.fn(), update: vi.fn() },
    quizSubmission: { create: vi.fn() },
    userProgress: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(async (callback) =>
      callback({
        quizAttemptSession: { update: vi.fn() },
        quizSubmission: { create: vi.fn() }
      })
    )
  }
}));

describe("submitQuizAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("scores a fully correct quiz and stores completed progress", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:15.000Z"));
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "user-1", status: "ACTIVE" }
    });
    (db.lesson.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      moduleId: "module-1",
      type: LessonType.QUIZ,
      isFinalTest: false,
      passingScore: 70,
      module: { courseId: "course-1", id: "module-1" },
      quiz: {
        questions: [
          {
            id: "question-1",
            type: QuestionType.SINGLE_CHOICE,
            choices: [
              { id: "choice-1", isCorrect: true },
              { id: "choice-2", isCorrect: false }
            ]
          },
          {
            id: "question-2",
            type: QuestionType.SINGLE_CHOICE,
            choices: [
              { id: "choice-3", isCorrect: true },
              { id: "choice-4", isCorrect: false }
            ]
          }
        ]
      }
    });
    (db.quizAttemptSession.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "attempt-1",
      userId: "user-1",
      lessonId: "lesson-1",
      courseId: "course-1",
      moduleId: "module-1",
      usedAt: null,
      expiresAt: new Date("2026-06-02T13:00:00.000Z"),
      startedAt: new Date("2026-06-02T12:00:00.000Z")
    });
    (db.userProgress.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await submitQuizAttempt({
      courseId: "course-1",
      moduleId: "module-1",
      lessonId: "lesson-1",
      attemptId: "attempt-1",
      selectedAnswers: [
        { questionId: "question-1", answerChoiceIds: ["choice-1"] },
        { questionId: "question-2", answerChoiceIds: ["choice-3"] }
      ]
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.score).toBe(100);
      expect(result.data.passed).toBe(true);
    }
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.userProgress.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          latestScore: 100
        })
      })
    );
  });

  it("rejects impossibly fast submissions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:01.000Z"));
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "user-1", status: "ACTIVE" }
    });
    (db.lesson.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      moduleId: "module-1",
      type: LessonType.QUIZ,
      isFinalTest: false,
      passingScore: 70,
      module: { courseId: "course-1", id: "module-1" },
      quiz: {
        questions: [
          {
            id: "question-1",
            type: QuestionType.SINGLE_CHOICE,
            choices: [{ id: "choice-1", isCorrect: true }]
          }
        ]
      }
    });
    (db.quizAttemptSession.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "attempt-1",
      userId: "user-1",
      lessonId: "lesson-1",
      courseId: "course-1",
      moduleId: "module-1",
      usedAt: null,
      expiresAt: new Date("2026-06-02T13:00:00.000Z"),
      startedAt: new Date("2026-06-02T12:00:00.000Z")
    });

    const result = await submitQuizAttempt({
      courseId: "course-1",
      moduleId: "module-1",
      lessonId: "lesson-1",
      attemptId: "attempt-1",
      selectedAnswers: [{ questionId: "question-1", answerChoiceIds: ["choice-1"] }]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("too quickly");
    }
  });
});
