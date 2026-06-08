import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Educator access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const profiles = await db.creatorProfile.findMany({
    where: {
      userId: { not: session.user.id },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { professionalTitle: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: { name: "asc" },
    take: 8,
    select: {
      id: true,
      username: true,
      name: true,
      professionalTitle: true,
      bio: true,
      avatarUrl: true,
      linkedinUrl: true,
      youtubeUrl: true
    }
  });

  return NextResponse.json({
    ok: true,
    data: profiles.map((profile) => ({
      id: profile.id,
      username: profile.username,
      name: profile.name,
      title: profile.professionalTitle,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      linkedinUrl: profile.linkedinUrl,
      youtubeUrl: profile.youtubeUrl
    }))
  });
}
