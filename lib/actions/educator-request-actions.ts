"use server";

import { revalidatePath } from "next/cache";
import { EducatorRequestStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { auth } from "@/auth";
import { sendEducatorWelcomeEmail } from "@/lib/email-verification";
import { createSystemInboxMessage } from "@/lib/actions/message-actions";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong." };
}

const submitSchema = z.object({
  message: z.string().trim().min(30, "Please provide at least 30 characters describing what you'd like to teach.").max(2000)
});

export async function submitEducatorRequest(input: z.infer<typeof submitSchema>): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("You must be signed in.");
    if (session.user.role !== UserRole.STUDENT) throw new Error("Only student accounts can request educator access.");

    const { message } = submitSchema.parse(input);

    await db.educatorRequest.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, message, status: EducatorRequestStatus.PENDING },
      update: { message, status: EducatorRequestStatus.PENDING, adminNote: null }
    });

    revalidatePath("/request-educator-access");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

const decisionSchema = z.object({
  requestId: z.string().min(1),
  adminNote: z.string().trim().max(1000).optional()
});

export async function approveEducatorRequest(input: z.infer<typeof decisionSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { requestId, adminNote } = decisionSchema.parse(input);

    const request = await db.educatorRequest.update({
      where: { id: requestId },
      data: { status: EducatorRequestStatus.APPROVED, adminNote: adminNote || null }
    });

    // Upgrade the user's role
    const newEducator = await db.user.update({
      where: { id: request.userId },
      data: { role: UserRole.EDUCATOR },
      select: { email: true, name: true }
    });

    // Welcome email + inbox notification (fire-and-forget, don't block approval)
    void sendEducatorWelcomeEmail({ email: newEducator.email, name: newEducator.name });
    void createSystemInboxMessage(request.userId, admin.id, buildWelcomeInboxMessage());

    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

function buildWelcomeInboxMessage(): string {
  return [
    "Congratulations — your educator application has been approved!",
    "",
    "Your KabulLearn account has been upgraded. You can now access your Educator Dashboard using the same email and password you already have. Just sign in at kabullearn.com and you will be taken there automatically.",
    "",
    "EDUCATOR RESOURCES",
    "• Educator Guidelines: kabullearn.com/educator-guidelines",
    "• Teaching Resources:  kabullearn.com/educator-resources",
    "",
    "ABOUT YOUR STUDENT HISTORY",
    "Your previous course progress and certificates are preserved. Contact us at info@kabulhub.com if you need access to them.",
    "",
    "Welcome to the team!",
    "— The KabulLearn Team"
  ].join("\n");
}

export async function rejectEducatorRequest(input: z.infer<typeof decisionSchema>): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { requestId, adminNote } = decisionSchema.parse(input);

    await db.educatorRequest.update({
      where: { id: requestId },
      data: { status: EducatorRequestStatus.REJECTED, adminNote: adminNote || null }
    });

    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
