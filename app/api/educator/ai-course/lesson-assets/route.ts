import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Only educators can view lesson assets." }, { status: 403 });
  }

  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ ok: false, error: "Missing lesson." }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      aiGeneratedAssets: true,
      module: {
        select: {
          course: {
            select: { authorId: true }
          }
        }
      }
    }
  });

  if (!lesson || lesson.module.course.authorId !== session.user.id) {
    return NextResponse.json({ ok: false, error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: lesson.aiGeneratedAssets ?? null });
}
