import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import nextEnv from "@next/env";
import { CourseStatus, LessonType, PrismaClient, QuestionType, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { loadEnvConfig } = nextEnv;

loadEnvConfig(path.join(__dirname, ".."));

const prisma = new PrismaClient();
const curriculumPath = path.join(__dirname, "..", "data", "data.json");

function markdownList(items, locale) {
  return items.map((item) => `- ${item[locale]}`).join("\n");
}

function normalizeLevel(level) {
  const key = level?.toLowerCase();

  if (["beginner", "foundational", "basic", "intro"].includes(key)) return "beginner";
  if (["intermediate", "middle"].includes(key)) return "intermediate";
  if (["advanced", "expert"].includes(key)) return "advanced";

  return null;
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "PohaRana Admin";

  if (!email || !password) {
    console.log("Skipping admin seed: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create an admin user.");
    return null;
  }

  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN
    },
    create: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  console.log(`Seeded admin user: ${email.toLowerCase()}`);
  return admin;
}

async function seedCurriculum(authorId) {
  if (!authorId) {
    console.log("Skipping curriculum seed: an admin author is required.");
    return;
  }

  const curriculum = JSON.parse(await readFile(curriculumPath, "utf8"));
  const authorProfile = await prisma.creatorProfile.upsert({
    where: { username: "poharana" },
    update: {
      name: "PohaRana",
      professionalTitle: "Learning design team",
      bio: "PohaRana creates structured bilingual learning experiences for durable understanding."
    },
    create: {
      username: "poharana",
      name: "PohaRana",
      professionalTitle: "Learning design team",
      bio: "PohaRana creates structured bilingual learning experiences for durable understanding.",
      createdById: authorId
    },
    select: { id: true }
  });
  let courseCount = 0;
  let moduleCount = 0;
  let lessonCount = 0;
  let quizCount = 0;
  let questionCount = 0;

  for (const course of curriculum.courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        slug: course.id,
        status: CourseStatus.PUBLISHED,
        level: normalizeLevel(course.level?.en),
        titleEn: course.title.en,
        titlePs: course.title.ps,
        descriptionEn: course.description.en,
        descriptionPs: course.description.ps,
        authorId,
        authorProfileId: authorProfile.id,
        publishedAt: new Date()
      },
      create: {
        id: course.id,
        slug: course.id,
        status: CourseStatus.PUBLISHED,
        level: normalizeLevel(course.level?.en),
        titleEn: course.title.en,
        titlePs: course.title.ps,
        descriptionEn: course.description.en,
        descriptionPs: course.description.ps,
        authorId,
        authorProfileId: authorProfile.id,
        publishedAt: new Date()
      }
    });
    courseCount += 1;

    for (const [moduleIndex, module] of course.modules.entries()) {
      const moduleId = `${course.id}:${module.id}`;

      await prisma.module.upsert({
        where: { id: moduleId },
        update: {
          courseId: course.id,
          order: moduleIndex + 1,
          titleEn: module.title.en,
          titlePs: module.title.ps
        },
        create: {
          id: moduleId,
          courseId: course.id,
          order: moduleIndex + 1,
          titleEn: module.title.en,
          titlePs: module.title.ps
        }
      });
      moduleCount += 1;

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        const lessonId = `${course.id}:${lesson.id}`;

        await prisma.lesson.upsert({
          where: { id: lessonId },
          update: {
            moduleId,
            order: lessonIndex + 1,
            type: LessonType.VIDEO,
            titleEn: lesson.title.en,
            titlePs: lesson.title.ps,
            descriptionEn: lesson.description.en,
            descriptionPs: lesson.description.ps,
            youtubeUrl: lesson.youtubeId,
            readingEn: markdownList(lesson.content, "en"),
            readingPs: markdownList(lesson.content, "ps"),
            isFinalTest: false,
            passingScore: null
          },
          create: {
            id: lessonId,
            moduleId,
            order: lessonIndex + 1,
            type: LessonType.VIDEO,
            titleEn: lesson.title.en,
            titlePs: lesson.title.ps,
            descriptionEn: lesson.description.en,
            descriptionPs: lesson.description.ps,
            youtubeUrl: lesson.youtubeId,
            readingEn: markdownList(lesson.content, "en"),
            readingPs: markdownList(lesson.content, "ps")
          }
        });
        lessonCount += 1;
      }

      const quizLessonId = `${course.id}:${module.id}:quiz`;

      await prisma.lesson.upsert({
        where: { id: quizLessonId },
        update: {
          moduleId,
          order: module.lessons.length + 1,
          type: LessonType.QUIZ,
          titleEn: module.quiz.title.en,
          titlePs: module.quiz.title.ps,
          descriptionEn: module.quiz.description.en,
          descriptionPs: module.quiz.description.ps,
          youtubeUrl: null,
          readingEn: null,
          readingPs: null,
          isFinalTest: true,
          passingScore: module.quiz.passScore
        },
        create: {
          id: quizLessonId,
          moduleId,
          order: module.lessons.length + 1,
          type: LessonType.QUIZ,
          titleEn: module.quiz.title.en,
          titlePs: module.quiz.title.ps,
          descriptionEn: module.quiz.description.en,
          descriptionPs: module.quiz.description.ps,
          isFinalTest: true,
          passingScore: module.quiz.passScore
        }
      });

      await prisma.quiz.upsert({
        where: { lessonId: quizLessonId },
        update: {},
        create: {
          id: `${course.id}:${module.quiz.id}`,
          lessonId: quizLessonId
        }
      });
      quizCount += 1;

      const quiz = await prisma.quiz.findUniqueOrThrow({
        where: { lessonId: quizLessonId },
        select: { id: true }
      });

      for (const [questionIndex, question] of module.quiz.questions.entries()) {
        const questionId = `${course.id}:${question.id}`;

        await prisma.question.upsert({
          where: { id: questionId },
          update: {
            quizId: quiz.id,
            order: questionIndex + 1,
            type: QuestionType.SINGLE_CHOICE,
            promptEn: question.question.en,
            promptPs: question.question.ps
          },
          create: {
            id: questionId,
            quizId: quiz.id,
            order: questionIndex + 1,
            type: QuestionType.SINGLE_CHOICE,
            promptEn: question.question.en,
            promptPs: question.question.ps
          }
        });
        questionCount += 1;

        for (const [choiceIndex, option] of question.options.entries()) {
          const choiceId = `${questionId}:choice-${choiceIndex + 1}`;

          await prisma.answerChoice.upsert({
            where: { id: choiceId },
            update: {
              questionId,
              order: choiceIndex + 1,
              textEn: option.en,
              textPs: option.ps,
              isCorrect: choiceIndex === question.answerIndex
            },
            create: {
              id: choiceId,
              questionId,
              order: choiceIndex + 1,
              textEn: option.en,
              textPs: option.ps,
              isCorrect: choiceIndex === question.answerIndex
            }
          });
        }
      }
    }
  }

  console.log(
    `Seeded curriculum: ${courseCount} courses, ${moduleCount} modules, ${lessonCount} video lessons, ${quizCount} quizzes, ${questionCount} questions.`
  );
}

async function main() {
  const admin = await seedAdmin();
  await seedCurriculum(admin?.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
