import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openai, EMBED_MODEL, CHAT_MODEL, cosineSimilarity } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
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
        content: [
          "You are a helpful AI assistant for KabulLearn, an online learning platform for Afghan students.",
          "Answer questions using ONLY the platform content provided below.",
          "You can answer questions about courses, lessons, how to register, how to sign in, platform features, terms of service, privacy policy, and any other provided content.",
          "When a user asks for a link, page, or URL, provide the full URL from the platform content (e.g. https://kabullearn.com/privacy). Always use full URLs, never relative paths.",
          "If the answer is not found in the provided content, say: \"I don't have that information — please contact support at info@kabulhub.com.\"",
          "Be concise, accurate, and helpful. Do not make things up.",
          "",
          "Platform content:",
          context
        ].join("\n")
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
