import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertRateLimit } from "@/lib/security";

const feedbackSchema = z.object({
  chatLogId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(-1)]),
  feedback: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertRateLimit(`ai-feedback:${session.user.id}`, 30);
  } catch {
    return NextResponse.json({ error: "Too many feedback requests." }, { status: 429 });
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
  }

  const updated = await db.aiChatLog.updateMany({
    where: { id: parsed.data.chatLogId, userId: session.user.id },
    data: {
      rating: parsed.data.rating,
      feedback: parsed.data.feedback || null
    }
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Chat log not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
