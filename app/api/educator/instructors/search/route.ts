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

  const where =
    query.length >= 2
      ? {
          id: { not: session.user.id },
          role: UserRole.EDUCATOR,
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { creatorProfile: { username: { contains: query, mode: "insensitive" as const } } },
            { creatorProfile: { professionalTitle: { contains: query, mode: "insensitive" as const } } }
          ]
        }
      : {
          id: { not: session.user.id },
          role: UserRole.EDUCATOR
        };

  const users = await db.user.findMany({
    where,
    orderBy: { name: "asc" },
    take: 50,
    select: {
      id: true,
      name: true,
      image: true,
      creatorProfile: {
        select: {
          id: true,
          username: true,
          professionalTitle: true,
          bio: true,
          avatarUrl: true,
          linkedinUrl: true,
          youtubeUrl: true
        }
      }
    }
  });

  return NextResponse.json({
    ok: true,
    data: users.map((user) => ({
      id: user.creatorProfile?.id ?? user.id,
      username: user.creatorProfile?.username ?? user.id,
      name: user.name ?? "Educator",
      title: user.creatorProfile?.professionalTitle ?? null,
      bio: user.creatorProfile?.bio ?? null,
      avatarUrl: user.creatorProfile?.avatarUrl ?? user.image ?? null,
      linkedinUrl: user.creatorProfile?.linkedinUrl ?? null,
      youtubeUrl: user.creatorProfile?.youtubeUrl ?? null
    }))
  });
}
