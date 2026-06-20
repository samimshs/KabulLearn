export const runtime = "edge";

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { Redis } from "@upstash/redis";
import OpenAI from "openai";
import {
  AI_COURSE_LIMITS,
  clampAiSettings,
  type AiBuilderSettings
} from "@/lib/ai-course-builder";
import { getAiSourceText } from "@/lib/ai-source-document-store";

const { auth } = NextAuth(authConfig);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

async function checkRateLimit(key: string, limit: number) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  if (count > limit) throw new Error("rate_limit_exceeded");
}

function languageLabel(language: AiBuilderSettings["primaryLanguage"]) {
  if (language === "ps") return "Afghan Pashto";
  if (language === "fa") return "Afghan Dari";
  return "English";
}

function lessonFormatLabel(format: AiBuilderSettings["lessonFormat"]) {
  if (format === "video") return "Video lessons (educator records the video; AI prepares slide outlines and speaking scripts)";
  if (format === "mixed") return "Mixed — AI assigns each lesson as reading or video based on content type";
  return "Reading lessons (text-based; students read the lesson content)";
}

function buildLessonTypeRule(format: AiBuilderSettings["lessonFormat"]) {
  if (format === "reading") {
    return 'Set "lessonType" to "reading" for every lesson. The "content" field must contain the full readable lesson text that students will read.';
  }
  if (format === "video") {
    return 'Set "lessonType" to "video" for every lesson. The "content" field must describe what this video covers and list key teaching points — it is a description for the educator, not reading body text.';
  }
  return 'Assign "lessonType" per lesson: use "reading" for theory, definitions, and reference material; use "video" for demonstrations, workflows, and step-by-step processes. For reading lessons, "content" must be full readable text. For video lessons, "content" must be a teaching description.';
}

function buildNarrationRule(settings: AiBuilderSettings) {
  const noScript = "Set all slide narration fields to empty strings for every lesson.";
  if (settings.lessonFormat === "reading" || !settings.generateVideoScript) return noScript;

  const langRule = settings.generateDariPashto
    ? "Include english, dari, and pashto speaking scripts."
    : "Write the speaking script in the primary language only; leave other narration fields as empty strings.";

  if (settings.lessonFormat === "video") {
    return `For every lesson, generate a speaking script in the narration fields. This is the educator's word-for-word guide for what to say when recording the video. ${langRule}`;
  }
  return `For lessons with lessonType "video", generate a speaking script in the narration fields (educator's recording guide). For lessons with lessonType "reading", set all narration fields to empty strings. ${langRule}`;
}

function buildGenerationPrompt(settings: AiBuilderSettings, sourceText = "") {
  const includeQuizzes = settings.generateQuizzes
    ? `Generate exactly ${settings.quizQuestionsPerLesson} quiz question(s) inside each lesson's "quiz" array. These questions will be combined into one module quiz when the draft is saved; do not create separate quiz lessons.`
    : "Return an empty quiz array for every lesson.";
  const includeSlides = settings.generateSlideOutlines
    ? `Generate exactly ${settings.slidesPerLesson} slide outline(s) per lesson. Keep each slide's onScreenText brief (1–2 sentences) so translations fit within the token budget. Include useful LaTeX equations where relevant.`
    : "Return an empty slides array for every lesson.";

  const sourceDocumentBlock =
    settings.sourceDocument && sourceText
      ? `\nSOURCE MATERIAL\n- Source: ${settings.sourceDocument.filename}\n- Extracted text (${settings.sourceDocument.characterCount.toLocaleString()} characters):\n${sourceText}\n`
      : "";

  const manualTotal = settings.moduleCount * settings.lessonsPerModule;
  const structureBlock = settings.autoStructure
    ? `COURSE STRUCTURE (AI-DECIDED)
Analyze the topic${settings.sourceDocument ? " and source material" : ""} and choose the number of modules and lessons.
- Each reading lesson must be written in full detail (700–1100 words). You have a strict output budget, so keep the total lesson count low enough to write every lesson completely.
- Create 2–4 modules. Each module must have exactly 2 lessons (no more).
- Maximum total: 8 lessons across the whole course. Do not exceed this — incomplete lessons are worse than fewer lessons.
- Group related subtopics into one lesson rather than splitting them if you are running short on budget.`
    : `COURSE STRUCTURE (CREATOR-SELECTED — STRICT)
- You MUST return exactly ${settings.moduleCount} module(s) in the top-level "modules" array.
- Each module MUST contain exactly ${settings.lessonsPerModule} content lesson(s) in its "lessons" array.
- Total generated content lessons MUST be exactly ${manualTotal}.
- Do NOT reduce the number of modules.
- Do NOT reduce the number of lessons per module.
- Do NOT merge modules or lessons to save space.
- Do NOT create separate quiz lessons in the JSON. Put quiz questions inside each content lesson's "quiz" array.
- If the output budget is tight, keep lesson content more concise, but preserve the exact module and lesson counts.`;

  const sourceGroundingRules = settings.sourceDocument
    ? "\nSOURCE DOCUMENT RULES\n- Use the uploaded source document as the primary reference.\n- Base the outline, lessons, quizzes, and slides primarily on the source material.\n- If the source material is thin, keep the course smaller rather than inventing unrelated topics.\n"
    : "";

  return `Create a complete draft course for KabulLearn.

COURSE REQUEST
- Topic: ${settings.topic}
- Target audience: ${settings.targetAudience}
- Difficulty: ${settings.difficulty}
- Primary language: ${languageLabel(settings.primaryLanguage)}
- Lesson format: ${lessonFormatLabel(settings.lessonFormat)}
- ${includeQuizzes}
- ${includeSlides}
${sourceDocumentBlock}
${structureBlock}

LESSON TYPE RULE
${buildLessonTypeRule(settings.lessonFormat)}

NARRATION / SPEAKING SCRIPT RULE
${buildNarrationRule(settings)}

TRANSLATION RULE
${settings.generateDariPashto ? `Dari and Pashto translations are REQUIRED throughout the course:
- The course object must include "titleDari", "titlePashto", "descriptionDari", and "descriptionPashto" alongside the English course title and description.
- Every module "title" and "description" must include a "titleDari", "titlePashto", "descriptionDari", "descriptionPashto" field alongside the English version.
- Every lesson "title" and "summary" must include "titleDari", "titlePashto", "summaryDari", "summaryPashto" alongside English.
- Every slide "title" and "onScreenText" must be a localized object: { "english": "...", "dari": "...", "pashto": "..." }.
- Every quiz question must include "questionDari", "questionPashto", "optionsDari", "optionsPashto", "explanationDari", and "explanationPashto" alongside the English quiz fields.
- Dari = Afghan Dari (دری), not Iranian Farsi. Pashto = Afghan Pashto (پښتو). Both must be non-empty strings.
- Do NOT produce literal word-for-word translations. Rewrite the meaning fluently, as original KabulLearn content written by an Afghan educator.
- Use KabulLearn terminology naturally: course = کورس, Pashto lesson = لوست, Dari lesson = درس, educator = استاد, Pashto learner = زده‌کوونکی, Dari learner = شاگرد.
- Avoid Iranian-only Dari wording and avoid overly literary/archaic Pashto. The tone must be polished, warm, educational, and natural for Afghan learners.
- Do NOT translate equationsLatex, variable names, or numbers.` : `No Dari/Pashto translations needed.
- Every slide "title" and "onScreenText" must be a localized object with only the "english" field filled; set "dari" and "pashto" to empty strings.`}

STRICT LIMITS
- Max modules: ${AI_COURSE_LIMITS.maxModules}
- Max lessons per module: ${AI_COURSE_LIMITS.maxLessonsPerModule}
- Max slides per lesson: ${AI_COURSE_LIMITS.maxSlidesPerLesson}
- Max quiz questions per lesson: ${AI_COURSE_LIMITS.maxQuizQuestionsPerLesson}
${sourceGroundingRules}

LESSON CONTENT — STRICT REQUIREMENTS
The "content" field is the full body text that students read. It must be written as continuous, teachable prose — NOT a summary, NOT bullet points, NOT an outline, NOT an introduction to content that "will be covered."

MANDATORY PARAGRAPH STRUCTURE (reading lessons):
- Paragraph 1 — Context and motivation: Why does this topic matter? What problem does it solve? Hook the student.
- Paragraph 2 — Core concept explained: Define and explain the central idea in plain language. Use an analogy if helpful.
- Paragraph 3 — How it works in detail: Go deeper. Explain the mechanism, the steps, or the underlying logic.
- Paragraph 4 — Worked example #1: Walk through a complete, concrete example step by step. Show the working, not just the answer.
- Paragraph 5 — Worked example #2 or variation: A second example showing a different angle, a harder case, or a real-world application.
- Paragraph 6 — Common mistakes and misconceptions: What do students get wrong? Why? How do you avoid it?
- Paragraph 7 — Key takeaways and connection to what comes next.
You may add up to one additional paragraph (max 8 total) if the topic genuinely needs it.
MINIMUM: 3 paragraphs. Every paragraph must be at least 4 sentences long.
Target: 700–1100 words per reading lesson.

BANNED in reading lesson content: bullet lists, numbered steps, headers, phrases like "in this lesson we will cover", "by the end of this lesson", or "as discussed above". Write as a knowledgeable teacher speaking directly to a student.

Video lessons: "content" is the educator's preparation notes — a structured outline of key points to cover when recording. 150–300 words, bullet points are fine here.

QUALITY REQUIREMENTS
- Write for Afghan students with clear, respectful educational language.
- Make lessons concrete and teachable, not generic.
- If equations are useful, put them in equationsLatex as raw LaTeX strings.
- For reading lessons and all text-based course content, every equation or math expression must use LaTeX notation. Do not write plain-text equations when LaTeX is appropriate.
- Quizzes should test understanding and include clear explanations.
- All content is a draft that the educator will review before publishing.

Return ONLY valid JSON in exactly this shape:
{
  "course": {
    "title": "",
    "titleDari": "",
    "titlePashto": "",
    "description": "",
    "descriptionDari": "",
    "descriptionPashto": "",
    "language": "",
    "difficulty": "",
    "targetAudience": "",
    "learningObjectives": []
  },
  "modules": [
    {
      "title": "",
      "description": "",
      "lessons": [
        {
          "lessonType": "reading",
          "title": "",
          "summary": "",
          "content": "",
          "durationMinutes": 0,
          "slides": [
            {
              "slideNumber": 1,
              "title": { "english": "", "dari": "", "pashto": "" },
              "visualDescription": "",
              "onScreenText": { "english": "", "dari": "", "pashto": "" },
              "equationsLatex": [],
              "animationNotes": "",
              "narration": { "english": "", "dari": "", "pashto": "" }
            }
          ],
          "quiz": [
            {
              "question": "",
              "questionDari": "",
              "questionPashto": "",
              "options": [],
              "optionsDari": [],
              "optionsPashto": [],
              "correctAnswer": "",
              "explanation": "",
              "explanationDari": "",
              "explanationPashto": ""
            }
          ]
        }
      ]
    }
  ]
}`;
}

export const POST = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "EDUCATOR") {
    return Response.json({ ok: false, error: "Only educators can generate courses." }, { status: 403 });
  }

  try {
    await checkRateLimit(`educator-ai-course:${session.user.id}`, 8);
  } catch {
    return Response.json({ ok: false, error: "Too many AI course requests. Please wait a moment and try again." }, { status: 429 });
  }

  let settings: AiBuilderSettings;
  try {
    settings = clampAiSettings(await req.json() as Parameters<typeof clampAiSettings>[0]);
  } catch {
    return Response.json({ ok: false, error: "Check the course builder settings and try again." }, { status: 400 });
  }

  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  let sourceText = "";
  if (settings.sourceDocument?.sourceType === "upload" && settings.sourceDocument.documentId) {
    sourceText = await getAiSourceText(session.user.id, settings.sourceDocument.documentId) ?? "";
    if (!sourceText) {
      return Response.json(
        { ok: false, error: "The uploaded source material expired. Please upload it again before generating." },
        { status: 400 }
      );
    }
  } else if (settings.sourceDocument?.sourceType === "paste") {
    sourceText = settings.sourceDocument.text?.slice(0, 30000) ?? "";
  }

  let stream: AsyncIterable<{ choices: Array<{ delta: { content?: string | null } }> }>;
  try {
    stream = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.35,
      max_tokens: 16000,
      stream: true,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are KabulLearn's AI Course Builder. Return strict JSON only. Never include markdown, comments, or prose outside JSON."
        },
        { role: "user", content: buildGenerationPrompt(settings, sourceText) }
      ]
    });
  } catch (error) {
    console.error("OpenAI stream initiation error:", error);
    return Response.json(
      { ok: false, error: "Could not start course generation. Please try again." },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        console.error("OpenAI stream error:", error);
        controller.error(error);
      }
    }
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
});
