import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CourseStatus, LessonType, Prisma, QuestionType, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveAiCourseDraftSchema, type GeneratedAiCourse } from "@/lib/ai-course-builder";
import { ensureCurrentEducatorProfile } from "@/lib/educator-profile";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "ai-generated-course";
}

async function uniqueCourseSlug(title: string) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (await db.course.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base.slice(0, 64)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function lessonAssets(input: {
  generated: GeneratedAiCourse;
  lesson: GeneratedAiCourse["modules"][number]["lessons"][number];
  moduleTitle: string;
}) {
  const sourceDocument = input.generated.course.sourceDocument;
  const hasScripts = input.lesson.slides.some(
    (s) => s.narration?.english || s.narration?.dari || s.narration?.pashto
  );
  return {
    source: "ai-course-builder",
    generatedAt: new Date().toISOString(),
    lessonType: input.lesson.lessonType,
    moduleTitle: input.moduleTitle,
    durationMinutes: input.lesson.durationMinutes,
    targetAudience: input.generated.course.targetAudience,
    learningObjectives: input.generated.course.learningObjectives,
    sourceDocument: sourceDocument
      ? {
          filename: sourceDocument.filename,
          uploadedAt: sourceDocument.uploadedAt,
          preview: sourceDocument.preview,
          characterCount: sourceDocument.characterCount,
          warning: sourceDocument.warning
        }
      : undefined,
    slides: input.lesson.slides,
    ...(hasScripts
      ? {
          speakingScript: input.lesson.slides.map((slide) => ({
            slideNumber: slide.slideNumber,
            title: slide.title,
            narration: slide.narration
          }))
        }
      : {})
  } satisfies Prisma.InputJsonValue;
}

function quizAssets(input: {
  moduleTitle: string;
  questionCount: number;
}) {
  return {
    source: "ai-course-builder",
    generatedAt: new Date().toISOString(),
    quizScope: "module",
    linkedModuleTitle: input.moduleTitle,
    questionCount: input.questionCount
  } satisfies Prisma.InputJsonValue;
}

function localizedFallback(value: string, pashto?: string, dari?: string) {
  return {
    en: value,
    ps: pashto?.trim() || value,
    da: dari?.trim() || value
  };
}

async function setLessonAiGeneratedAssets(
  tx: Prisma.TransactionClient,
  lessonId: string,
  assets: Prisma.InputJsonValue
) {
  await tx.$executeRawUnsafe(
    'UPDATE "Lesson" SET "aiGeneratedAssets" = CAST($1 AS JSONB) WHERE "id" = $2',
    JSON.stringify(assets),
    lessonId
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Only educators can save AI-generated drafts." }, { status: 403 });
  }

  const parsed = saveAiCourseDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "The generated course draft is invalid. Please regenerate and try again." }, { status: 400 });
  }

  const generated = parsed.data.generated;

  try {
    const slug = await uniqueCourseSlug(generated.course.title);
    const courseId = await db.$transaction(async (tx) => {
      const profile = await ensureCurrentEducatorProfile(tx, session.user.id);
      const title = localizedFallback(generated.course.title, generated.course.titlePashto, generated.course.titleDari);
      const description = localizedFallback(
        generated.course.description,
        generated.course.descriptionPashto,
        generated.course.descriptionDari
      );

      const course = await tx.course.create({
        data: {
          slug,
          status: CourseStatus.DRAFT,
          level: generated.course.difficulty,
          titleEn: title.en,
          titlePs: title.ps,
          titleDa: title.da,
          descriptionEn: description.en,
          descriptionPs: description.ps,
          descriptionDa: description.da,
          authorId: session.user.id,
          authorProfileId: profile.id,
          isPaid: false,
          priceCents: null,
          currency: "usd",
          instructors: {
            create: [{ profileId: profile.id, order: 0 }]
          }
        },
        select: { id: true }
      });

      for (const [moduleIndex, generatedModule] of generated.modules.entries()) {
        const moduleTitle = localizedFallback(generatedModule.title, generatedModule.titlePashto, generatedModule.titleDari);
        const moduleDescription = localizedFallback(
          generatedModule.description || generatedModule.title,
          generatedModule.descriptionPashto,
          generatedModule.descriptionDari
        );
        const module = await tx.module.create({
          data: {
            courseId: course.id,
            order: moduleIndex + 1,
            titleEn: moduleTitle.en,
            titlePs: moduleTitle.ps,
            titleDa: moduleTitle.da,
            descriptionEn: moduleDescription.en,
            descriptionPs: moduleDescription.ps,
            descriptionDa: moduleDescription.da
          },
          select: { id: true }
        });

        const moduleQuizQuestions: Array<{
          question: GeneratedAiCourse["modules"][number]["lessons"][number]["quiz"][number];
        }> = [];
        let lessonOrder = 1;
        for (const generatedLesson of generatedModule.lessons) {
          const lessonTitle = localizedFallback(generatedLesson.title, generatedLesson.titlePashto, generatedLesson.titleDari);
          const lessonSummary = localizedFallback(generatedLesson.summary, generatedLesson.summaryPashto, generatedLesson.summaryDari);
          const lessonContent = localizedFallback(generatedLesson.content);

          const isVideo = generatedLesson.lessonType === "video";
          const lesson = await tx.lesson.create({
            data: {
              moduleId: module.id,
              order: lessonOrder,
              type: isVideo ? LessonType.VIDEO : LessonType.READING,
              titleEn: lessonTitle.en,
              titlePs: lessonTitle.ps,
              titleDa: lessonTitle.da,
              descriptionEn: lessonSummary.en,
              descriptionPs: lessonSummary.ps,
              descriptionDa: lessonSummary.da,
              readingEn: isVideo ? null : lessonContent.en,
              readingPs: isVideo ? null : lessonContent.ps,
              readingDa: isVideo ? null : lessonContent.da
            },
            select: { id: true }
          });
          await setLessonAiGeneratedAssets(
            tx,
            lesson.id,
            lessonAssets({ generated, lesson: generatedLesson, moduleTitle: generatedModule.title })
          );
          lessonOrder += 1;

          // Skip questions with no text or fewer than 2 options — these are AI generation artifacts.
          const validQuestions = generatedLesson.quiz.filter(
            (q) => q.question.trim().length > 0 && q.options.length >= 2
          );
          moduleQuizQuestions.push(
            ...validQuestions.map((question) => ({ question }))
          );
        }

        if (moduleQuizQuestions.length > 0) {
          const quizLessonTitle = localizedFallback(
            `${generatedModule.title} Quiz`,
            `${generatedModule.titlePashto || generatedModule.title} ازموینه`,
            `${generatedModule.titleDari || generatedModule.title} آزمون`
          );
          const quizLessonSummary = localizedFallback(
            `Check your understanding of ${generatedModule.title}.`,
            `د ${generatedModule.titlePashto || generatedModule.title} په اړه خپله پوهه وازمویئ.`,
            `درک خود را از ${generatedModule.titleDari || generatedModule.title} بسنجید.`
          );
          const quizLesson = await tx.lesson.create({
            data: {
              moduleId: module.id,
              order: lessonOrder,
              type: LessonType.QUIZ,
              titleEn: quizLessonTitle.en,
              titlePs: quizLessonTitle.ps,
              titleDa: quizLessonTitle.da,
              descriptionEn: quizLessonSummary.en,
              descriptionPs: quizLessonSummary.ps,
              descriptionDa: quizLessonSummary.da,
              passingScore: 70
            },
            select: { id: true }
          });
          await setLessonAiGeneratedAssets(
            tx,
            quizLesson.id,
            quizAssets({
              moduleTitle: generatedModule.title,
              questionCount: moduleQuizQuestions.length
            })
          );

          const quiz = await tx.quiz.create({
            data: { lessonId: quizLesson.id },
            select: { id: true }
          });

          for (const [questionIndex, { question }] of moduleQuizQuestions.entries()) {
            const prompt = localizedFallback(question.question, question.questionPashto, question.questionDari);
            const explanation = localizedFallback(question.explanation || "", question.explanationPashto, question.explanationDari);
            const questionRow = await tx.question.create({
              data: {
                quizId: quiz.id,
                order: questionIndex + 1,
                type: QuestionType.SINGLE_CHOICE,
                promptEn: prompt.en,
                promptPs: prompt.ps,
                promptDa: prompt.da,
                correctAnswer: question.correctAnswer,
                explanationEn: explanation.en,
                explanationPs: explanation.ps,
                explanationDa: explanation.da
              },
              select: { id: true }
            });

            const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
            const matchedCorrect = question.options.some((option) => option.trim().toLowerCase() === normalizedCorrect);

            await tx.answerChoice.createMany({
              data: question.options.map((option, optionIndex) => {
                const optionText = localizedFallback(
                  option,
                  question.optionsPashto[optionIndex],
                  question.optionsDari[optionIndex]
                );
                return {
                  questionId: questionRow.id,
                  order: optionIndex + 1,
                  textEn: optionText.en,
                  textPs: optionText.ps,
                  textDa: optionText.da,
                  isCorrect: matchedCorrect
                    ? option.trim().toLowerCase() === normalizedCorrect
                    : optionIndex === 0
                };
              })
            });
          }
        }
      }

      return course.id;
    }, { timeout: 30000 });

    revalidatePath("/educator");
    revalidatePath(`/educator/courses/${courseId}`);

    return NextResponse.json({ ok: true, data: { courseId } });
  } catch (error) {
    console.error("AI course draft save error:", error);
    const devError = process.env.NODE_ENV === "production"
      ? undefined
      : error instanceof Error
        ? error.message
        : String(error);
    return NextResponse.json({ ok: false, error: "Could not save the AI-generated course draft right now.", devError }, { status: 500 });
  }
}
