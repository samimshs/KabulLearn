import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureCurrentEducatorProfile } from "@/lib/educator-profile";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Educator access required." }, { status: 403 });
  }

  const profile = await ensureCurrentEducatorProfile(db, session.user.id).catch(() => null);

  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: profile.id,
      name: profile.name,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      title: profile.professionalTitle ?? undefined
    }
  });
}
