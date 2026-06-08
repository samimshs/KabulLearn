import { z } from "zod";

const localizedRequired = z.string().trim().min(1).max(200);
const localizedDescription = z.string().trim().min(1).max(5000);
const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(60, "Username must be under 60 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");
const optionalUrl = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().url().optional()
);
const optionalText = (max: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max).optional()
  );

export const instructorSchema = z.object({
  name: z.string().trim().min(1, "Instructor name is required.").max(120),
  username: username,
  title: optionalText(160),
  titlePs: optionalText(160),
  titleDa: optionalText(160),
  bio: optionalText(1600),
  bioPs: optionalText(1600),
  bioDa: optionalText(1600),
  avatarUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  youtubeUrl: optionalUrl,
});

export type InstructorInput = z.infer<typeof instructorSchema>;

export const createCourseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional().or(z.literal("")),
  titleEn: localizedRequired,
  titlePs: localizedRequired,
  titleDa: optionalText(200),
  descriptionEn: localizedDescription,
  descriptionPs: localizedDescription,
  descriptionDa: optionalText(5000),
  instructors: z.array(instructorSchema).min(1, "Add at least one instructor.")
});

export const createCourseDbSchema = createCourseSchema.transform((value) => {
  const { instructors, ...course } = value;
  return { course, instructors };
});

export const courseIdSchema = z.object({
  courseId: z.string().cuid()
});

export const updateCourseSchema = courseIdSchema.extend({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional().or(z.literal("")),
  titleEn: localizedRequired,
  titlePs: localizedRequired,
  titleDa: optionalText(200),
  descriptionEn: localizedDescription,
  descriptionPs: localizedDescription,
  descriptionDa: optionalText(5000),
  instructors: z.array(instructorSchema).min(1, "Add at least one instructor.")
});

export const updateCourseDbSchema = updateCourseSchema.transform((value) => {
  const { instructors, ...course } = value;
  return { course, instructors };
});

export const createModuleSchema = z.object({
  courseId: z.string().cuid(),
  titleEn: localizedRequired,
  titlePs: localizedRequired,
  titleDa: optionalText(200),
  descriptionEn: localizedDescription.optional(),
  descriptionPs: localizedDescription.optional(),
  descriptionDa: optionalText(5000)
});

export const moduleIdSchema = z.object({
  moduleId: z.string().cuid()
});

export const createLessonSchema = z
  .object({
    moduleId: z.string().cuid(),
    type: z.enum(["VIDEO", "READING", "QUIZ"]),
    titleEn: localizedRequired,
    titlePs: localizedRequired,
    titleDa: optionalText(200),
    descriptionEn: localizedDescription.optional(),
    descriptionPs: localizedDescription.optional(),
    descriptionDa: optionalText(5000),
    youtubeUrl: optionalUrl,
    readingEn: z.string().trim().optional(),
    readingPs: z.string().trim().optional(),
    readingDa: z.string().trim().optional(),
    isFinalTest: z.boolean().optional(),
    passingScore: z.number().int().min(0).max(100).optional()
  })
  .superRefine((data, ctx) => {
    if (data.type === "VIDEO") {
      if (!data.youtubeUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["youtubeUrl"],
          message: "Video lessons require a YouTube URL."
        });
      }
    }

    if (data.type === "READING") {
      if (!data.readingEn && !data.readingPs && !data.readingDa) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["readingEn"],
          message: "Reading lessons require English, Pashto, or Dari content."
        });
      }
    }

    if (data.type === "QUIZ") {
      if (data.youtubeUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["youtubeUrl"],
          message: "Quiz lessons should not include a video URL."
        });
      }
    }
  });

export const lessonIdSchema = z.object({
  lessonId: z.string().cuid()
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
