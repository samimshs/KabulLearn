import { notFound, redirect } from "next/navigation";
import { CourseStatus, LessonType, ProgressStatus, QuestionType, UserRole } from "@prisma/client";
import { QuizView } from "@/components/QuizView";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getQuizAttemptStatus } from "@/lib/actions/quiz-actions";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";
import { usesPashtoContent } from "@/lib/i18n";

type QuizCourse = {
  id: string; titleEn: string; titlePs: string;
  descriptionEn: string; descriptionPs: string;
  level: string | null;
  status: CourseStatus;
  publishedAt: Date | null;
  authorId: string;
  modules: Array<{
    id: string; titleEn: string; titlePs: string;
    descriptionEn: string | null; descriptionPs: string | null;
    order: number;
    lessons: Array<{
      id: string; moduleId: string; order: number;
      type: LessonType; titleEn: string; titlePs: string;
      descriptionEn: string | null; descriptionPs: string | null;
      youtubeUrl: string | null; readingEn: string | null; readingPs: string | null;
      isFinalTest: boolean; passingScore: number | null;
      quiz: {
        id: string; lessonId: string;
        questions: Array<{
          id: string; promptEn: string; promptPs: string;
          correctAnswer: string | null;
          explanationEn: string | null; explanationPs: string | null;
          order: number; type: QuestionType;
          choices: Array<{
            id: string; textEn: string; textPs: string;
            isCorrect: boolean; order: number;
          }>;
        }>;
      } | null;
    }>;
  }>;
};

export default async function QuizPage({
  params
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const rawParams = await params;
  const courseId = decodeURIComponent(rawParams.courseId);
  const moduleId = decodeURIComponent(rawParams.moduleId);
  const locale = await getServerLocale();

  let course: QuizCourse | null = null;

  try {
    course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        ...localizedCourseSelect(locale),
        status: true,
        publishedAt: true,
        authorId: true,
        modules: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            ...localizedModuleSelect(locale),
            order: true,
            lessons: {
              orderBy: [{ order: "asc" }],
              select: {
                id: true, moduleId: true, order: true, type: true,
                ...localizedLessonSelect(locale),
                youtubeUrl: true,
                isFinalTest: true, passingScore: true,
                quiz: {
                  select: {
                    id: true, lessonId: true,
                    questions: {
                      orderBy: [{ order: "asc" }],
	                      select: {
	                        id: true,
	                        promptEn: true, promptPs: true,
							...(locale === "fa" ? { promptDa: true, explanationDa: true } : {}),
							explanationEn: true, explanationPs: true,
	                        correctAnswer: true,
	                        order: true, type: true,
	                        choices: {
	                          orderBy: [{ order: "asc" }],
	                          select: {
	                            id: true,
	                            textEn: true, textPs: true,
									...(locale === "fa" ? { textDa: true } : {}),
	                            isCorrect: true, order: true
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
    }) as unknown as QuizCourse | null;
  } catch {
    throw new Error("Database temporarily unavailable.");
  }

  if (!course) return notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isEducatorAuthor =
    session?.user?.role === UserRole.EDUCATOR && course.authorId === userId;

  if (!isAdmin && !isEducatorAuthor &&
      course.status !== CourseStatus.PUBLISHED &&
      !(course.status === CourseStatus.PENDING_REVIEW && course.publishedAt !== null)) {
    return notFound();
  }

  // Fold the active locale's content (titlePs for ps, titleDa for fa) into the
  // `…Ps` field the views read for any non-English locale, so Dari shows.
  const localized = (row: unknown, base: string): string | null => {
    const r = row as Record<string, string | null | undefined>;
    if (locale === "fa") return r[`${base}Da`] ?? r[`${base}En`] ?? null;
    if (locale === "ps") return r[`${base}Ps`] ?? r[`${base}En`] ?? null;
    return r[`${base}En`] ?? null;
  };

  const normalizedCourse: QuizCourse = {
    ...course,
    titleEn: course.titleEn ?? "",
    titlePs: localized(course, "title") ?? course.titleEn ?? "",
    descriptionEn: course.descriptionEn ?? "",
    descriptionPs: localized(course, "description") ?? course.descriptionEn ?? "",
    level: (course as unknown as { level?: string | null }).level ?? null,
    modules: course.modules.map((courseModule) => ({
      ...courseModule,
      titleEn: courseModule.titleEn ?? "",
      titlePs: localized(courseModule, "title") ?? courseModule.titleEn ?? "",
      descriptionEn: courseModule.descriptionEn ?? null,
      descriptionPs: localized(courseModule, "description"),
      lessons: courseModule.lessons.map((lesson) => ({
        ...lesson,
        titleEn: lesson.titleEn ?? "",
        titlePs: localized(lesson, "title") ?? lesson.titleEn ?? "",
        descriptionEn: lesson.descriptionEn ?? null,
        descriptionPs: localized(lesson, "description"),
        readingEn: lesson.readingEn ?? null,
        readingPs: localized(lesson, "reading"),
        quiz: lesson.quiz
          ? {
              ...lesson.quiz,
              questions: lesson.quiz.questions.map((question) => ({
                ...question,
                promptEn: question.promptEn ?? question.promptPs ?? "",
                promptPs: localized(question, "prompt") ?? question.promptEn ?? "",
                explanationEn: question.explanationEn ?? null,
                explanationPs: localized(question, "explanation") ?? null,
                explanationDa: (question as Record<string, unknown>).explanationDa as string | null ?? null,
                choices: question.choices.map((choice) => ({
                  ...choice,
                  textEn: choice.textEn ?? choice.textPs ?? "",
                  textPs: localized(choice, "text") ?? choice.textEn ?? "",
                  textDa: (choice as Record<string, unknown>).textDa as string | null ?? null
                }))
              }))
            }
          : null
      }))
    }))
  };

  const module = normalizedCourse.modules.find((m) => m.id === moduleId);
  if (!module) {
    return notFound();
  }

  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${encodeURIComponent(courseId)}`)}`);
  }

  if (!isAdmin && !isEducatorAuthor) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });
    if (!enrollment) {
      redirect(`/courses/${encodeURIComponent(courseId)}`);
    }
  }

  let serverPassedModuleIds: string[] = [];
  let lessonStatuses: Record<string, "IN_PROGRESS" | "COMPLETED"> = {};
  let previousScore: number | null = null;
  let attemptStatus: { attemptsUsed: number; retryAt: string | null } = { attemptsUsed: 0, retryAt: null };

  try {
    // Find the quiz lesson for this module (same logic as QuizView)
    const quizLesson = module.lessons.find(
      (l) => (l.quiz?.questions?.length ?? 0) > 0
    ) ?? module.lessons.at(-1);

    const [progressRows, quizProgress, quizAttemptStatus] = await Promise.all([
      db.userProgress.findMany({
        where: { userId, lesson: { module: { courseId } } },
        select: { lessonId: true, status: true, lesson: { select: { moduleId: true, type: true } } }
      }),
      quizLesson
        ? db.userProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: quizLesson.id } },
            select: { latestScore: true, bestScore: true }
          })
        : null,
      quizLesson ? getQuizAttemptStatus(quizLesson.id) : Promise.resolve({ attemptsUsed: 0, retryAt: null })
    ]);

    serverPassedModuleIds = Array.from(new Set(
      progressRows
        .filter((p) => p.status === ProgressStatus.COMPLETED && p.lesson.type === "QUIZ")
        .map((p) => p.lesson.moduleId)
    ));
    for (const p of progressRows) {
      if (p.status === ProgressStatus.COMPLETED || p.status === ProgressStatus.IN_PROGRESS) {
        lessonStatuses[p.lessonId] = p.status;
      }
    }
    previousScore = quizProgress?.latestScore ?? quizProgress?.bestScore ?? null;
    attemptStatus = quizAttemptStatus;
  } catch {
    // progress unavailable
  }

  const totalModules = course.modules.length;
  const isComplete = isAdmin || isEducatorAuthor || (totalModules > 0 && serverPassedModuleIds.length >= totalModules);
  const thisModulePassed = serverPassedModuleIds.includes(moduleId);

  return (
    <QuizView
      course={normalizedCourse}
      module={module}
      serverPassedModuleIds={serverPassedModuleIds}
      lessonStatuses={lessonStatuses}
      isComplete={isComplete}
      previousScore={thisModulePassed ? previousScore : null}
      attemptStatus={thisModulePassed ? undefined : attemptStatus}
    />
  );
}
