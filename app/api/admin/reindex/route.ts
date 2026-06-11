import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openai, EMBED_MODEL } from "@/lib/openai";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lessons = await db.lesson.findMany({
    where: { type: { not: "QUIZ" } },
    select: {
      id: true,
      titleEn: true,
      descriptionEn: true,
      readingEn: true,
      module: {
        select: {
          titleEn: true,
          course: { select: { titleEn: true } }
        }
      }
    }
  });

  let indexed = 0;

  for (const lesson of lessons) {
    const parts = [
      `Course: ${lesson.module.course.titleEn}`,
      `Module: ${lesson.module.titleEn}`,
      `Lesson: ${lesson.titleEn}`,
      lesson.descriptionEn ?? "",
      lesson.readingEn ? lesson.readingEn.slice(0, 6000) : ""
    ].filter(Boolean);

    const fullText = parts.join("\n\n");
    if (!fullText.trim()) continue;

    const embResponse = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: fullText
    });

    const vector = embResponse.data[0].embedding;

    await db.lessonEmbedding.upsert({
      where: { lessonId: lesson.id },
      create: {
        lessonId: lesson.id,
        chunkText: fullText.slice(0, 3000),
        embedding: JSON.stringify(vector)
      },
      update: {
        chunkText: fullText.slice(0, 3000),
        embedding: JSON.stringify(vector)
      }
    });

    indexed++;
  }

  return NextResponse.json({ indexed, total: lessons.length });
}
