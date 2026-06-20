import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { openai } from "@/lib/openai";
import { assertRateLimit } from "@/lib/security";

const choiceSchema = z.object({
  id: z.string().trim().min(1).max(120),
  textEn: z.string().trim().max(500)
});

const questionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  promptEn: z.string().trim().max(1200),
  explanationEn: z.string().trim().max(1200),
  choices: z.array(choiceSchema).max(8)
});

const requestSchema = z.object({
  questions: z.array(questionSchema).min(1).max(30)
});

const responseSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    promptPs: z.string().default(""),
    promptDa: z.string().default(""),
    explanationPs: z.string().default(""),
    explanationDa: z.string().default(""),
    choices: z.array(z.object({
      id: z.string(),
      textPs: z.string().default(""),
      textDa: z.string().default("")
    })).default([])
  })).default([])
});

const SYSTEM_PROMPT = `You are KabulLearn's senior Afghan localization editor.
Translate quiz content into fluent Afghan Pashto and Afghan Dari, not literal word-for-word translations.

Language rules:
- Pashto must be natural Afghan Pashto used by today's Afghan learners.
- Dari must be Afghan Dari, not Iranian Farsi.
- Rewrite naturally as a clear Afghan educator would phrase it.
- Preserve formulas, variables, numbers, code, URLs, names, and answer meaning exactly.
- Do not add hints that reveal the answer.
- Keep answer choices concise and parallel.
- Return strict JSON only.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.EDUCATOR && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await assertRateLimit(`educator-translate-quiz:${session.user.id}`, 20);
  } catch {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const questions = parsed.data.questions
    .map((question) => ({
      ...question,
      choices: question.choices.filter((choice) => choice.textEn.trim())
    }))
    .filter((question) => question.promptEn.trim() || question.explanationEn.trim() || question.choices.length > 0);

  if (questions.length === 0) {
    return NextResponse.json({ ok: false, error: "No quiz text to translate." }, { status: 400 });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.25,
    max_tokens: 12000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Translate this quiz content. Keep every id exactly the same.

Return exactly:
{
  "questions": [
    {
      "id": "",
      "promptPs": "",
      "promptDa": "",
      "explanationPs": "",
      "explanationDa": "",
      "choices": [
        { "id": "", "textPs": "", "textDa": "" }
      ]
    }
  ]
}

Quiz JSON:
${JSON.stringify({ questions }, null, 2)}`
      }
    ]
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ ok: false, error: "Quiz translation unavailable" }, { status: 503 });
  }

  const content = response.choices[0]?.message.content ?? "{}";
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    data = {};
  }

  const result = responseSchema.safeParse(data);
  if (!result.success) {
    return NextResponse.json({ ok: false, error: "Quiz translation could not be parsed." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
