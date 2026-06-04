"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireEducator } from "@/lib/rbac";

export type ActionResult<T = void> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }

  return { ok: false, error: "Something went wrong." };
}

const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole)
});

const resetUserPasswordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, "Temporary password must be at least 8 characters.").max(128)
});

const deleteUserSchema = z.object({
  userId: z.string().min(1)
});

const educatorProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  bio: z.string().trim().max(1200).optional(),
  image: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url("Photo must be a valid image URL.").optional()
  )
});

export async function updateUserRole(input: z.infer<typeof updateUserRoleSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { userId, role } = updateUserRoleSchema.parse(input);

    if (userId === admin.id && role !== UserRole.ADMIN) {
      throw new Error("You cannot remove your own admin access.");
    }

    await db.user.update({
      where: { id: userId },
      data: { role }
    });

    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetUserPassword(input: z.infer<typeof resetUserPasswordSchema>): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { userId, password } = resetUserPasswordSchema.parse(input);
    const passwordHash = await hash(password, 12);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    revalidatePath("/admin");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteUser(input: z.infer<typeof deleteUserSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { userId } = deleteUserSchema.parse(input);

    if (userId === admin.id) {
      throw new Error("You cannot delete your own admin account.");
    }

    await db.$transaction([
      // CourseReviewEvent uses onDelete: Restrict — clear audit rows first
      db.courseReviewEvent.deleteMany({ where: { actorId: userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateEducatorProfile(input: z.infer<typeof educatorProfileSchema>): Promise<ActionResult> {
  try {
    const educator = await requireEducator();
    const values = educatorProfileSchema.parse(input);

    await db.user.update({
      where: { id: educator.id },
      data: {
        name: values.name,
        bio: values.bio || null,
        image: values.image || null
      }
    });

    revalidatePath("/educator");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
