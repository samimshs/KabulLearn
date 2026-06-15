"use server";

import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import type { ActionResult } from "@/lib/actions/user-actions";

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Something went wrong." };
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Display name is required.").max(120),
  bio: z.string().trim().max(1200, "Bio must be under 1200 characters.").optional(),
  image: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url("Avatar must be a valid image URL.").optional()
  ),
  linkedinUrl: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url("LinkedIn URL must be a valid URL.").optional()
  )
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(128),
  confirmPassword: z.string().min(8, "Confirm your new password.")
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match."
});

export async function updateLearnerProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult<{ image: string | null }>> {
  try {
    const user = await requireUser();
    const values = profileSchema.parse(input);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: values.name,
        bio: values.bio || null,
        image: values.image || null
      },
      select: { image: true }
    });

    if (user.role === UserRole.EDUCATOR) {
      await db.creatorProfile.updateMany({
        where: {
          OR: [
            { userId: user.id },
            {
              courseInstructors: {
                some: {
                  order: 0,
                  course: { authorId: user.id }
                }
              }
            }
          ]
        },
        data: {
          name: values.name,
          bio: values.bio || null,
          avatarUrl: values.image || null,
          linkedinUrl: values.linkedinUrl || null
        }
      });
      revalidatePath("/educator");
      revalidatePath("/educator/settings");
      revalidatePath("/courses");
      revalidatePath("/creators");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { ok: true, data: { image: updated.image } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function changeLearnerPassword(input: z.infer<typeof passwordSchema>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const values = passwordSchema.parse(input);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true }
    });

    if (!dbUser?.passwordHash) {
      throw new Error("This account does not have a password. Use your sign-in provider or reset password by email.");
    }

    const valid = await compare(values.currentPassword, dbUser.passwordHash);
    if (!valid) {
      throw new Error("Current password is incorrect.");
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(values.newPassword, 12) }
    });

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function logOutAllDatabaseSessions(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await db.session.deleteMany({ where: { userId: user.id } });
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function exportLearnerData(): Promise<ActionResult<{ filename: string; json: string }>> {
  try {
    const user = await requireUser();
    const data = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          select: {
            createdAt: true,
            course: { select: { id: true, titleEn: true, titlePs: true, titleDa: true } }
          }
        },
        certificates: {
          select: {
            id: true,
            grade: true,
            issuedAt: true,
            verificationCode: true,
            course: { select: { id: true, titleEn: true, titlePs: true, titleDa: true } }
          }
        },
        quizSubmissions: {
          select: { id: true, score: true, passed: true, submittedAt: true, lessonId: true }
        }
      }
    });

    return {
      ok: true,
      data: {
        filename: "kabullearn-data-export.json",
        json: JSON.stringify({ exportedAt: new Date().toISOString(), user: data }, null, 2)
      }
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function requestAccountDeletion(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const admin = await db.user.findFirst({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });
    if (!admin) throw new Error("Account deletion requests are temporarily unavailable.");

    await db.directMessage.create({
      data: {
        senderId: user.id,
        recipientId: admin.id,
        body: `Account deletion request from ${user.name ?? user.email} (${user.email}). Please review and process according to the KabulLearn privacy policy.`
      }
    });

    revalidatePath("/admin/messages");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
