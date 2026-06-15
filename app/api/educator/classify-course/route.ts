import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { openai } from "@/lib/openai";
import { assertRateLimit } from "@/lib/security";

const schema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(2000),
});

const CATEGORIES = [
  "Computer Basics",
  "Software & Web Development",
  "Data Science",
  "Statistics",
  "Machine Learning & AI",
  "Mathematics",
] as const;

const SYSTEM_PROMPT = `You are a course classification assistant for KabulLearn, an Afghan e-learning platform.

Given a course title and description in English, determine the course level.

LEVEL GUIDELINES
- "beginner": no prior knowledge required; introduces fundamental concepts from scratch
- "intermediate": requires some background; builds on basic knowledge
- "advanced": requires solid foundation; covers specialized or complex topics

CATEGORY GUIDELINES
Choose the single best-fit from: ${CATEGORIES.join(", ")}

OUTPUT: Return ONLY a JSON object: { "level": "beginner" | "intermediate" | "advanced", "category": "<one of the listed categories>" }
No other text.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.EDUCATOR && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await assertRateLimit(`educator-classify:${session.user.id}`, 20);
  } catch {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Title: ${parsed.data.title}\n\nDescription: ${parsed.data.description}`
      }
    ]
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ ok: false, error: "Classification unavailable" }, { status: 503 });
  }

  const content = response.choices[0]?.message.content ?? "{}";
  let data: unknown;
  try { data = JSON.parse(content); } catch { data = {}; }

  const result = z.object({
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    category: z.string().optional(),
  }).safeParse(data);

  return NextResponse.json({
    ok: true,
    data: {
      level: result.success ? (result.data.level ?? "") : "",
      category: result.success ? (result.data.category ?? "") : "",
    }
  });
}
