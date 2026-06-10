import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET — fetch last known playback position for resume banner
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ positionSec: 0 });

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ positionSec: 0 });

  try {
    const last = await db.lessonHeartbeat.findFirst({
      where: { userId: session.user.id, lessonId },
      orderBy: { createdAt: "desc" },
      select: { positionSec: true, durationSec: true }
    });
    // Only resume if not within the last 5% (video nearly finished)
    if (last && last.durationSec > 0 && last.positionSec / last.durationSec < 0.95) {
      return NextResponse.json({ positionSec: last.positionSec });
    }
    return NextResponse.json({ positionSec: 0 });
  } catch {
    return NextResponse.json({ positionSec: 0 });
  }
}
