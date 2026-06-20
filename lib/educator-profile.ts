import { Prisma } from "@prisma/client";

type EducatorProfileClient = Pick<Prisma.TransactionClient, "user" | "creatorProfile">;

export function creatorUsernameFrom(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  return slug || `creator-${Date.now()}`;
}

async function uniqueCreatorUsername(client: EducatorProfileClient, baseInput: string) {
  const base = creatorUsernameFrom(baseInput);
  let candidate = base;
  let suffix = 2;

  while (await client.creatorProfile.findUnique({ where: { username: candidate }, select: { id: true } })) {
    candidate = `${base.slice(0, 46)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function linkProfileToUser(client: EducatorProfileClient, profileId: string, userId: string) {
  return client.creatorProfile.update({
    where: { id: profileId },
    data: { userId },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      professionalTitle: true
    }
  }).catch(() => client.creatorProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      professionalTitle: true
    }
  }));
}

export async function ensureCurrentEducatorProfile(client: EducatorProfileClient, userId: string) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      image: true,
      creatorProfile: {
        select: {
          id: true,
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
    throw new Error("User not found.");
  }

  if (user.creatorProfile) {
    return user.creatorProfile;
  }

  const displayName = user.name || user.email.split("@")[0];
  const desiredUsername = creatorUsernameFrom(displayName);

  const usernameMatch = await client.creatorProfile.findUnique({
    where: { username: desiredUsername },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      professionalTitle: true,
      userId: true,
      createdById: true
    }
  });

  if (usernameMatch?.createdById === userId && (!usernameMatch.userId || usernameMatch.userId === userId)) {
    return usernameMatch.userId === userId
      ? usernameMatch
      : linkProfileToUser(client, usernameMatch.id, userId);
  }

  const nameMatch = await client.creatorProfile.findFirst({
    where: {
      createdById: userId,
      userId: null,
      name: displayName
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      professionalTitle: true
    }
  });

  if (nameMatch) {
    return linkProfileToUser(client, nameMatch.id, userId);
  }

  return client.creatorProfile.create({
    data: {
      username: await uniqueCreatorUsername(client, displayName),
      name: displayName,
      avatarUrl: user.image,
      bio: user.bio,
      professionalTitle: "Educator",
      createdById: userId,
      userId
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      professionalTitle: true
    }
  });
}
