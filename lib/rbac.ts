import { UserRole } from "@prisma/client";
import { auth } from "@/auth";

export class AuthenticationError extends Error {
  constructor(message = "You must be signed in to continue.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const roleRank: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.EDUCATOR]: 2,
  [UserRole.ADMIN]: 3
};

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthenticationError();
  }

  return session.user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requireMinimumRole(role: UserRole) {
  const user = await requireUser();

  if (roleRank[user.role] < roleRank[role]) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requireEducator() {
  return requireRole([UserRole.EDUCATOR]);
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN]);
}

export function canManageCourse(params: { requesterId: string; requesterRole: UserRole; authorId: string }) {
  return params.requesterRole === UserRole.ADMIN || params.requesterId === params.authorId;
}
