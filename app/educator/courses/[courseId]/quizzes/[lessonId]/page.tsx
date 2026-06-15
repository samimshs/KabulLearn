import Link from "next/link";
import { UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canManageCourse } from "@/lib/rbac";
import { QuizBuilderForm } from "@/components/educator/QuizBuilderForm";

type Props = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function QuizBuilderPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Feducator");
  }
  if (session.user.role === UserRole.ADMIN) {
    redirect("/admin");
  }
  if (session.user.role !== UserRole.EDUCATOR) {
    redirect("/dashboard");
  }

  const educator = session.user;
  const rawParams = await params;
  const courseId = decodeURIComponent(rawParams.courseId);
  const lessonId = decodeURIComponent(rawParams.lessonId);

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      titleEn: true,
      titlePs: true,
      passingScore: true,
      isFinalTest: true,
      module: {
        select: {
          course: { select: { id: true, titleEn: true, authorId: true } }
        }
      },
      quiz: {
        select: {
          id: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              type: true,
              promptEn: true,
              promptPs: true,
              promptDa: true,
              correctAnswer: true,
              explanationEn: true,
              explanationPs: true,
              explanationDa: true,
              choices: {
                orderBy: { order: "asc" },
                select: { id: true, order: true, textEn: true, textPs: true, textDa: true, isCorrect: true }
              }
            }
          }
        }
      }
    }
  });

  if (!lesson || lesson.module.course.id !== courseId) {
    notFound();
  }

  if (!canManageCourse({ requesterId: educator.id, requesterRole: educator.role, authorId: lesson.module.course.authorId })) {
    notFound();
  }

  if (!lesson.quiz) {
    notFound();
  }

  const questions = lesson.quiz.questions;
  const answerChoiceCount = questions.reduce((count, question) => count + question.choices.length, 0);
  const questionsWithoutCorrectAnswer = questions.filter((question) => !question.choices.some((choice) => choice.isCorrect)).length;

  return (
    <main className="pr-page grid gap-6">
      <section className="pr-panel grid gap-5 p-7 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="pr-eyebrow">Quiz Builder</p>
            <h1 className="pr-h1 mt-4">
              {lesson.titleEn}
            </h1>
            <p className="pr-copy mt-5 max-w-3xl">
              Add questions and answer choices for this quiz. Every quiz needs questions, and every question needs at least one correct answer before course review.
            </p>
          </div>
          <Link
            href={`/educator/courses/${courseId}`}
            className="pr-btn-ghost"
          >
            Back to course
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-[800] text-[var(--muted)]">
            Passing score
            <p className="mt-2 text-lg text-[var(--ink)]">{lesson.passingScore ?? 70}%</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-[800] text-[var(--muted)]">
            Quiz type
            <p className="mt-2 text-lg text-[var(--ink)]">{lesson.isFinalTest ? "Final test" : "Module quiz"}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-[800] text-[var(--muted)]">
            Questions
            <p className="mt-2 text-lg text-[var(--ink)]">{questions.length}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-[800] text-[var(--muted)]">
            Answer choices
            <p className="mt-2 text-lg text-[var(--ink)]">{answerChoiceCount}</p>
          </div>
        </div>

        {questions.length === 0 || questionsWithoutCorrectAnswer > 0 ? (
          <div className="rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-[800] text-amber-800">
            {questions.length === 0
              ? "Add at least one question to make this quiz reviewable."
              : `${questionsWithoutCorrectAnswer} question${questionsWithoutCorrectAnswer === 1 ? "" : "s"} still need a correct answer.`}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-[800] text-emerald-700">
            This quiz has questions and correct answers.
          </div>
        )}
      </section>

      <QuizBuilderForm
        courseId={courseId}
        lessonId={lessonId}
        questions={questions}
      />
    </main>
  );
}
