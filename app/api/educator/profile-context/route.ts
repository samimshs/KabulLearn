import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function usernameFrom(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  return slug || `creator-${Date.now()}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Educator access required." }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      image: true,
      creatorProfile: {
        select: {
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
          professionalTitle: true
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }

  const displayName = user.creatorProfile?.name ?? user.name ?? user.email.split("@")[0];

  return NextResponse.json({
    ok: true,
    data: {
      id: user.id,
      name: displayName,
      username: user.creatorProfile?.username ?? usernameFrom(displayName),
      avatarUrl: user.creatorProfile?.avatarUrl ?? user.image,
      bio: user.creatorProfile?.bio ?? user.bio,
      title: user.creatorProfile?.professionalTitle ?? undefined
    }
  });
}
