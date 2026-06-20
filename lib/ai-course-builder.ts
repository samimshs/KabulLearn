import { z } from "zod";

export const AI_COURSE_LIMITS = {
  maxModules: 8,
  maxLessonsPerModule: 10,
  maxSlidesPerLesson: 10,
  maxQuizQuestionsPerLesson: 10
} as const;

export const aiBuilderSettingsSchema = z.object({
  topic: z.string().trim().min(5).max(240),
  targetAudience: z.string().trim().min(3).max(300),
  lessonFormat: z.enum(["reading", "video", "mixed"]).default("reading"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  primaryLanguage: z.enum(["en", "ps", "fa"]),
  autoStructure: z.boolean().default(true),
  moduleCount: z.coerce.number().int().min(1).max(AI_COURSE_LIMITS.maxModules).default(3),
  lessonsPerModule: z.coerce.number().int().min(1).max(AI_COURSE_LIMITS.maxLessonsPerModule).default(3),
  generateQuizzes: z.boolean(),
  generateSlideOutlines: z.boolean(),
  generateVideoScript: z.boolean().default(true),
  generateDariPashto: z.boolean(),
  slidesPerLesson: z.coerce.number().int().min(1).max(AI_COURSE_LIMITS.maxSlidesPerLesson),
  quizQuestionsPerLesson: z.coerce.number().int().min(1).max(AI_COURSE_LIMITS.maxQuizQuestionsPerLesson),
  sourceDocument: z.object({
    sourceType: z.enum(["upload", "paste"]).default("upload"),
    documentId: z.string().trim().max(120).optional(),
    filename: z.string().trim().min(1).max(240),
    uploadedAt: z.string().trim().min(1).max(80),
    preview: z.string().trim().max(800),
    text: z.string().trim().max(32000).optional(),
    characterCount: z.number().int().min(1),
    warning: z.string().trim().max(500).optional()
  }).optional()
});

const narrationSchema = z.object({
  english: z.string().default(""),
  dari: z.string().default(""),
  pashto: z.string().default("")
});

// Lenient: AI can return a plain string or a localized object; empty strings are fine
const localizedTextSchema = z.union([
  z.string().trim().max(1200),
  z.object({
    english: z.string().trim().max(1200).default(""),
    dari: z.string().trim().max(1200).default(""),
    pashto: z.string().trim().max(1200).default("")
  })
]).default("");

const slideSchema = z.object({
  slideNumber: z.coerce.number().int().min(0).max(AI_COURSE_LIMITS.maxSlidesPerLesson).default(1),
  title: localizedTextSchema,
  visualDescription: z.string().trim().max(1200).default(""),
  onScreenText: localizedTextSchema,
  equationsLatex: z.array(z.string().trim().max(400)).max(12).default([]),
  animationNotes: z.string().trim().max(1200).default(""),
  narration: narrationSchema.default({ english: "", dari: "", pashto: "" })
});

const quizQuestionSchema = z.object({
  question: z.string().trim().max(1200).default(""),
  questionDari: z.string().trim().max(1200).default(""),
  questionPashto: z.string().trim().max(1200).default(""),
  options: z.array(z.string().trim().max(500)).max(6).default([]),
  optionsDari: z.array(z.string().trim().max(500)).max(6).default([]),
  optionsPashto: z.array(z.string().trim().max(500)).max(6).default([]),
  correctAnswer: z.string().trim().max(500).default(""),
  explanation: z.string().trim().max(1200).default(""),
  explanationDari: z.string().trim().max(1200).default(""),
  explanationPashto: z.string().trim().max(1200).default("")
});

const lessonSchema = z.object({
  lessonType: z.string().transform(v => (v?.toLowerCase() === "video" ? "video" : "reading") as "reading" | "video").default("reading"),
  title: z.string().trim().max(220).default("Untitled Lesson"),
  titleDari: z.string().trim().max(220).default(""),
  titlePashto: z.string().trim().max(220).default(""),
  summary: z.string().trim().max(1000).default(""),
  summaryDari: z.string().trim().max(1000).default(""),
  summaryPashto: z.string().trim().max(1000).default(""),
  content: z.string().trim().max(30000).default(""),
  durationMinutes: z.coerce.number().int().min(0).max(240).default(0),
  slides: z.array(slideSchema).max(AI_COURSE_LIMITS.maxSlidesPerLesson).default([]),
  quiz: z.array(quizQuestionSchema).max(AI_COURSE_LIMITS.maxQuizQuestionsPerLesson).default([])
});

const moduleSchema = z.object({
  title: z.string().trim().max(220).default("Untitled Module"),
  titleDari: z.string().trim().max(220).default(""),
  titlePashto: z.string().trim().max(220).default(""),
  description: z.string().trim().max(1600).default(""),
  descriptionDari: z.string().trim().max(1600).default(""),
  descriptionPashto: z.string().trim().max(1600).default(""),
  lessons: z.array(lessonSchema).max(AI_COURSE_LIMITS.maxLessonsPerModule).default([])
});

// Normalise the difficulty enum regardless of how the AI capitalises it
const difficultySchema = z.string()
  .transform(v => v?.toLowerCase())
  .pipe(z.enum(["beginner", "intermediate", "advanced"]))
  .catch("beginner");

export const generatedAiCourseSchema = z.object({
  course: z.object({
    title: z.string().trim().max(220).default("Untitled Course"),
    titleDari: z.string().trim().max(220).default(""),
    titlePashto: z.string().trim().max(220).default(""),
    description: z.string().trim().max(5000).default(""),
    descriptionDari: z.string().trim().max(5000).default(""),
    descriptionPashto: z.string().trim().max(5000).default(""),
    language: z.string().trim().max(80).default("English"),
    difficulty: difficultySchema,
    targetAudience: z.string().trim().max(500).default(""),
    learningObjectives: z.array(z.string().trim().max(300)).max(12).default([]),
    sourceDocument: aiBuilderSettingsSchema.shape.sourceDocument.optional()
  }),
  modules: z.array(moduleSchema).min(1).max(AI_COURSE_LIMITS.maxModules)
});

export const saveAiCourseDraftSchema = z.object({
  generated: generatedAiCourseSchema
});

export type AiBuilderSettings = z.infer<typeof aiBuilderSettingsSchema>;
export type GeneratedAiCourse = z.infer<typeof generatedAiCourseSchema>;

export function clampAiSettings(input: z.input<typeof aiBuilderSettingsSchema>): AiBuilderSettings {
  const raw = input as Record<string, unknown>;
  return aiBuilderSettingsSchema.parse({
    ...raw,
    moduleCount: Math.min(Number(raw.moduleCount ?? 3), AI_COURSE_LIMITS.maxModules),
    lessonsPerModule: Math.min(Number(raw.lessonsPerModule ?? 3), AI_COURSE_LIMITS.maxLessonsPerModule),
    slidesPerLesson: Math.min(Number(raw.slidesPerLesson ?? 5), AI_COURSE_LIMITS.maxSlidesPerLesson),
    quizQuestionsPerLesson: Math.min(Number(raw.quizQuestionsPerLesson ?? 4), AI_COURSE_LIMITS.maxQuizQuestionsPerLesson)
  });
}
