import { notFound, redirect } from "next/navigation";
import { CourseStatus, LessonType, ProgressStatus, QuestionType } from "@prisma/client";
import { QuizView } from "@/components/QuizView";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getServerLocale, localizedCourseSelect, localizedLessonSelect, localizedModuleSelect } from "@/lib/server-locale";
import { usesPashtoContent } from "@/lib/i18n";

type QuizCourse = {
  id: string; titleEn: string; titlePs: string;
  descriptionEn: string; descriptionPs: string;
  level: string | null;
  status: CourseStatus;
  publishedAt: Date | null;
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
	                        ...(usesPashtoContent(locale) ? { promptPs: true, explanationPs: true } : { promptEn: true, explanationEn: true }),
	                        correctAnswer: true,
	                        order: true, type: true,
	                        choices: {
	                          orderBy: [{ order: "asc" }],
	                          select: {
	                            id: true,
	                            ...(usesPashtoContent(locale) ? { textPs: true } : { textEn: true }),
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

  if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
    return notFound();
  }

  const normalizedCourse: QuizCourse = {
    ...course,
    titleEn: course.titleEn ?? course.titlePs ?? "",
    titlePs: course.titlePs ?? course.titleEn ?? "",
    descriptionEn: course.descriptionEn ?? course.descriptionPs ?? "",
    descriptionPs: course.descriptionPs ?? course.descriptionEn ?? "",
    level: (course as unknown as { level?: string | null }).level ?? null,
    modules: course.modules.map((courseModule) => ({
      ...courseModule,
      titleEn: courseModule.titleEn ?? courseModule.titlePs ?? "",
      titlePs: courseModule.titlePs ?? courseModule.titleEn ?? "",
      descriptionEn: courseModule.descriptionEn ?? courseModule.descriptionPs ?? null,
      descriptionPs: courseModule.descriptionPs ?? courseModule.descriptionEn ?? null,
      lessons: courseModule.lessons.map((lesson) => ({
        ...lesson,
        titleEn: lesson.titleEn ?? lesson.titlePs ?? "",
        titlePs: lesson.titlePs ?? lesson.titleEn ?? "",
        descriptionEn: lesson.descriptionEn ?? lesson.descriptionPs ?? null,
        descriptionPs: lesson.descriptionPs ?? lesson.descriptionEn ?? null,
        readingEn: lesson.readingEn ?? lesson.readingPs ?? null,
        readingPs: lesson.readingPs ?? lesson.readingEn ?? null,
        quiz: lesson.quiz
          ? {
              ...lesson.quiz,
              questions: lesson.quiz.questions.map((question) => ({
                ...question,
                promptEn: question.promptEn ?? question.promptPs ?? "",
                promptPs: question.promptPs ?? question.promptEn ?? "",
                explanationEn: question.explanationEn ?? question.explanationPs ?? null,
                explanationPs: question.explanationPs ?? question.explanationEn ?? null,
                choices: question.choices.map((choice) => ({
                  ...choice,
                  textEn: choice.textEn ?? choice.textPs ?? "",
                  textPs: choice.textPs ?? choice.textEn ?? ""
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

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${encodeURIComponent(courseId)}`)}`);
  }

  let isEnrolled = false;
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });
    isEnrolled = Boolean(enrollment);
  } catch {
    // DB error on enrollment check — allow access
    isEnrolled = true;
  }

  if (!isEnrolled) {
    redirect(`/courses/${encodeURIComponent(courseId)}`);
  }

  let serverPassedModuleIds: string[] = [];
  let previousScore: number | null = null;

  try {
    // Find the quiz lesson for this module (same logic as QuizView)
    const quizLesson = module.lessons.find(
      (l) => (l.quiz?.questions?.length ?? 0) > 0
    ) ?? module.lessons.at(-1);

    const [progressRows, quizProgress] = await Promise.all([
      db.userProgress.findMany({
        where: {
          userId,
          status: ProgressStatus.COMPLETED,
          lesson: { type: "QUIZ", module: { courseId } }
        },
        select: { lesson: { select: { moduleId: true } } }
      }),
      quizLesson
        ? db.userProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: quizLesson.id } },
            select: { latestScore: true, bestScore: true }
          })
        : null
    ]);

    serverPassedModuleIds = Array.from(new Set(progressRows.map((p) => p.lesson.moduleId)));
    previousScore = quizProgress?.latestScore ?? quizProgress?.bestScore ?? null;
  } catch {
    // progress unavailable
  }

  const totalModules = course.modules.length;
  const isComplete = totalModules > 0 && serverPassedModuleIds.length >= totalModules;
  const thisModulePassed = serverPassedModuleIds.includes(moduleId);

  return (
    <QuizView
      course={normalizedCourse}
      module={module}
      serverPassedModuleIds={serverPassedModuleIds}
      isComplete={isComplete}
      previousScore={thisModulePassed ? previousScore : null}
    />
  );
}
