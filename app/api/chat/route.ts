import { NextRequest } from "next/server";
import { CourseStatus, UserStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { openai, EMBED_MODEL, CHAT_MODEL } from "@/lib/openai";
import { assertRateLimit, assertRateLimitWindow } from "@/lib/security";

const EDUCATOR_INTENT_RE = /\b(educator|teacher|instructor|teach|creator|course creator|create course)\b|استاد|ښوونک|کورس جوړ|کورس جوړوون|مدرس|آموزگار|ساختن کورس|سازنده کورس/i;
const MAX_MESSAGE_CHARS = 1200;
const DAILY_AI_LIMIT = 100;

type SourceRef = {
  source: string;
  sourceKey: string;
  title: string;
  href: string;
};

function detectLocale(text: string) {
  if (/[\u0600-\u06FF]/.test(text)) {
    return /[ۀؤئيېۍټډړږښګڼ]/.test(text) ? "ps" : "fa";
  }
  return "en";
}

function sourceHref(source: string, sourceKey: string) {
  if (source === "course") return `/courses/${encodeURIComponent(sourceKey)}`;
  if (source === "lesson") {
    const [courseId, lessonId] = sourceKey.split(":");
    if (courseId && lessonId) return `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
  }
  if (source === "terms") return "/terms";
  if (source === "privacy") return "/privacy";
  if (source === "guide") return "/learner-support";
  return "/";
}


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { status: true }
  });
  if (!user || user.status === UserStatus.VERIFICATION_PENDING) {
    return new Response("Please verify your email before using AI chat.", { status: 403 });
  }

  const { message, courseId } = (await req.json()) as {
    message: string;
    courseId?: string;
  };

  if (!message?.trim()) {
    return new Response("Bad request", { status: 400 });
  }
  const trimmedMessage = message.trim();
  if (trimmedMessage.length > MAX_MESSAGE_CHARS) {
    return new Response("Message is too long.", { status: 400 });
  }
  try {
    await assertRateLimit(`ai-chat:${session.user.id}`, 20);
    await assertRateLimitWindow(`ai-chat-day:${session.user.id}`, DAILY_AI_LIMIT, 24 * 60 * 60 * 1000);
  } catch {
    return new Response("Too many AI chat requests. Please wait a moment and try again.", { status: 429 });
  }

  const [resolvedCourse, publishedCourses] = await Promise.all([
    courseId
      ? db.course.findFirst({
          where: { OR: [{ id: courseId }, { slug: courseId }] },
          select: { id: true }
        }).catch(() => null)
      : Promise.resolve(null),
    db.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: { titleEn: true, slug: true, id: true },
      orderBy: { createdAt: "asc" }
    }).catch(() => [])
  ]);
  const scopedCourseId = resolvedCourse?.id ?? courseId;

  // 1. Embed the user's question
  const embResponse = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: trimmedMessage
  });
  const vectorStr = `[${embResponse.data[0].embedding.join(",")}]`;

  // 2. ANN search via pgvector — fetch top 12, apply educator boost in JS, take top 8
  type EmbRow = { source: string; sourceKey: string; title: string; chunkText: string; score: number };

  const embRows: EmbRow[] = scopedCourseId
    ? await db.$queryRaw<EmbRow[]>(Prisma.sql`
        SELECT source, "sourceKey", title, "chunkText",
          (1 - (embedding <=> ${vectorStr}::vector))::float8 AS score
        FROM "ContentEmbedding"
        WHERE embedding IS NOT NULL
          AND (
            (source = 'course' AND "sourceKey" = ${scopedCourseId})
            OR (source = 'lesson' AND "sourceKey" LIKE ${scopedCourseId + ":%"})
            OR source IN ('terms', 'privacy', 'guide')
          )
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT 12
      `)
    : await db.$queryRaw<EmbRow[]>(Prisma.sql`
        SELECT source, "sourceKey", title, "chunkText",
          (1 - (embedding <=> ${vectorStr}::vector))::float8 AS score
        FROM "ContentEmbedding"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT 12
      `);

  if (embRows.length === 0) {
    const fallback = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(
          "The platform content hasn't been indexed yet. An admin needs to run the AI index first."
        ));
        c.close();
      }
    });
    return new Response(fallback, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // 3. Apply educator-intent boost and pick top 8
  const educatorIntent = EDUCATOR_INTENT_RE.test(trimmedMessage);
  const scored = embRows.map(row => ({
    text: row.chunkText,
    label: `[${row.source}:${row.sourceKey}] ${row.title}`,
    score: Number(row.score) + (educatorIntent && row.sourceKey.includes("guide-become-educator") ? 0.35 : 0)
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 8);
  const sourceRefs: SourceRef[] = top.map((item) => {
    const match = item.label.match(/^\[(.+?):(.+?)\] (.*)$/);
    const source = match?.[1] ?? "content";
    const sourceKey = match?.[2] ?? "";
    const title = match?.[3] ?? item.label;
    return { source, sourceKey, title, href: sourceHref(source, sourceKey) };
  });
  const locale = detectLocale(trimmedMessage);
  const chatLog = await db.aiChatLog.create({
    data: {
      userId: session.user.id,
      courseId: resolvedCourse?.id ?? null,
      question: trimmedMessage,
      locale,
      sources: sourceRefs
    },
    select: { id: true }
  }).catch(() => null);

  const context = top
    .map(c => `[${c.label}]\n${c.text}`)
    .join("\n\n---\n\n");

  const catalogSummary = publishedCourses.length > 0
    ? `\n\nPLATFORM CATALOG (live data — use this to answer questions about available courses):\nTotal published courses: ${publishedCourses.length}\nCourse list:\n${publishedCourses.map((c, i) => `${i + 1}. ${c.titleEn} — https://kabullearn.com/courses/${encodeURIComponent(c.slug ?? c.id)}`).join("\n")}`
    : "";

  // 4. Stream the answer
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    stream: true,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a helpful AI assistant for KabulLearn, an online learning platform for Afghan students.

LANGUAGE RULE — this is mandatory and overrides everything else:
Determine the response language by reading the user's message ONLY. Never let the language of the platform content below influence what language you write in.
- User message is in English → your entire response must be in English.
- User message is in Pashto → your entire response must be in Pashto.
- User message is in Dari → your entire response must be in Dari.

CONTENT RULE:
Answer questions using ONLY the platform content provided below. You can answer questions about courses, lessons, how to register, how to sign in, platform features, terms of service, privacy policy, and any other provided content.
The platform content may contain English, Pashto, or Dari text. Translate and adapt the relevant parts into the user's language when answering.
When a user asks for a link or URL, always provide the full URL (e.g. https://kabullearn.com/privacy), never a relative path.
If the answer is not found in the provided content, say so briefly in the user's language. Do not make things up.
${catalogSummary}

Platform content:
${context}`
      },
      { role: "user", content: trimmedMessage }
    ]
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let fullAnswer = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          fullAnswer += delta;
          controller.enqueue(enc.encode(delta));
        }
      }
      if (chatLog) {
        await db.aiChatLog.update({
          where: { id: chatLog.id },
          data: { answer: fullAnswer }
        }).catch(() => null);
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...(chatLog ? { "X-KabulLearn-Chat-Log-Id": chatLog.id } : {})
    }
  });
}
