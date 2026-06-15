import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { openai } from "@/lib/openai";
import { assertRateLimit } from "@/lib/security";

const schema = z.object({
  text: z.string().trim().min(3).max(1600),
  context: z.enum(["courseTitle", "courseDescription", "moduleTitle", "lessonTitle", "lessonSummary", "readingContent", "instructorTitle", "instructorBio", "quizPrompt", "answerChoice", "quizExplanation"])
});

const contextGuide: Record<string, string> = {
  courseTitle:       "This is a short course title (2–8 words). Make it clear, compelling, and marketable — the kind of title an Afghan learner would click on.",
  courseDescription: "This is a course description (1–4 sentences). Convey the learning outcome and promise in a way that sounds like an experienced Afghan educator wrote it.",
  moduleTitle:       "This is a module/section title (2–6 words). Keep it clear and specific to the topic.",
  lessonTitle:       "This is a lesson title (2–6 words). Concise and descriptive.",
  lessonSummary:     "This is a one-sentence lesson summary. Write a natural, complete sentence.",
  readingContent:    "This is the body of a reading lesson. Preserve all headings, bullet points, and numbered steps. Translate prose idiomatically.",
  instructorTitle:   "This is an educator's professional job title (2–8 words, e.g. 'Senior Software Engineer' or 'Data Science Instructor'). Translate concisely — keep it as a title, not a sentence.",
  instructorBio:     "This is an educator's professional biography (1–6 sentences). The tone should be professional yet warm, like a respected Afghan academic introducing themselves. Preserve any mentioned credentials, institutions, or years of experience.",
  quizPrompt:        "This is a quiz question prompt (1–2 sentences). Keep it clear and unambiguous so students understand exactly what is being asked.",
  answerChoice:      "This is a short answer choice for a multiple-choice quiz question (a few words to one short sentence). Translate exactly and concisely — do not add explanation.",
  quizExplanation:   "This is a post-answer explanation shown to students after they submit a quiz question (1–3 sentences). It should clarify why the correct answer is right. Translate naturally so an Afghan student would understand."
};

const SYSTEM_PROMPT = `You are a professional translator for KabulLearn, an Afghan e-learning platform, specializing in Afghan educational content.

TARGET LANGUAGES
- "ps": Afghan Pashto — standard written Pashto as used in Kabul and major Afghan cities. Use vocabulary that Afghan students and educators actually use today. Avoid archaic or overly literary forms.
- "fa": Afghan Dari — NOT Iranian Farsi. Afghan Dari has distinct vocabulary, idioms, and preferences from Iranian Persian. Avoid Iranian colloquialisms, Iranian French-origin loanwords, and Iranian-specific cultural references. Write as an Afghan educator in Kabul would write.

TRANSLATION PRINCIPLES
1. Convey meaning and intent, never translate word-for-word if it sounds unnatural.
2. Read the output aloud mentally — it must sound like a fluent native Afghan speaker wrote it from scratch.
3. Register: professional but clear and approachable, like a respected Afghan university instructor.
4. Technical terms: keep widely recognized terms (Python, AI, API, HTML, CSS) unchanged. For concepts, use established Afghan educational equivalents (e.g. "machine learning" → "د ماشین زده‌کړه" in ps, "یادگیری ماشین" in fa).
5. English loanwords: only keep them if no standard Afghan equivalent exists in everyday educated usage.
6. Do NOT add parenthetical notes, explanations, or commentary inside the translation.

OUTPUT: Return ONLY a JSON object with exactly two string keys: "ps" and "fa". No other text.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.EDUCATOR && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await assertRateLimit(`educator-translate:${session.user.id}`, 30);
  } catch {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${contextGuide[parsed.data.context] ?? "Translate the following text."}

Source (English):
${parsed.data.text}`
      }
    ]
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ ok: false, error: "Translation unavailable" }, { status: 503 });
  }

  const content = response.choices[0]?.message.content ?? "{}";
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    data = {};
  }
  const result = z.object({ ps: z.string().optional(), fa: z.string().optional() }).safeParse(data);

  return NextResponse.json({
    ok: true,
    data: {
      ps: result.success ? result.data.ps ?? "" : "",
      fa: result.success ? result.data.fa ?? "" : ""
    }
  });
}
