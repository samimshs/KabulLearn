import { NextRequest } from "next/server";
import { UserStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openai, EMBED_MODEL, CHAT_MODEL, cosineSimilarity } from "@/lib/openai";

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

  const { message } = (await req.json()) as {
    message: string;
    courseId?: string;
  };

  if (!message?.trim()) {
    return new Response("Bad request", { status: 400 });
  }

  // 1. Embed the user's question
  const embResponse = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: message.trim()
  });
  const queryVec = embResponse.data[0].embedding;

  // 2. Load all stored embeddings (all content types — similarity search handles relevance)
  const rows = await db.contentEmbedding.findMany({
    select: {
      source: true,
      title: true,
      chunkText: true,
      embedding: true
    }
  });

  if (rows.length === 0) {
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

  // 3. Score and pick the top 5 most relevant chunks
  const scored = rows.map(row => ({
    text: row.chunkText,
    label: `[${row.source}] ${row.title}`,
    score: cosineSimilarity(queryVec, JSON.parse(row.embedding) as number[])
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  const context = top
    .map(c => `[${c.label}]\n${c.text}`)
    .join("\n\n---\n\n");

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

Platform content:
${context}`
      },
      { role: "user", content: message.trim() }
    ]
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) controller.enqueue(enc.encode(delta));
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
