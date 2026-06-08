"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function toErr(e: unknown): ActionResult<never> {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input." };
  if (e instanceof Error) return { ok: false, error: e.message };
  return { ok: false, error: "Something went wrong." };
}

const sendSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().trim().min(1, "Message cannot be empty.").max(4000)
});

const broadcastSchema = z.object({
  role: z.nativeEnum(UserRole),
  body: z.string().trim().min(1, "Message cannot be empty.").max(4000)
});

/** Send a direct message from admin to any single user. */
export async function adminSendMessage(input: z.infer<typeof sendSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { recipientId, body } = sendSchema.parse(input);

    if (recipientId === admin.id) throw new Error("Cannot message yourself.");

    await db.directMessage.create({ data: { senderId: admin.id, recipientId, body } });

    revalidatePath("/admin/messages");
    return { ok: true, data: undefined };
  } catch (e) {
    return toErr(e);
  }
}

/** Broadcast a message from admin to every user of a given role. */
export async function adminBroadcast(input: z.infer<typeof broadcastSchema>): Promise<ActionResult<{ count: number }>> {
  try {
    const admin = await requireAdmin();
    const { role, body } = broadcastSchema.parse(input);

    const recipients = await db.user.findMany({
      where: { role, NOT: { id: admin.id } },
      select: { id: true }
    });

    if (recipients.length === 0) return { ok: true, data: { count: 0 } };

    await db.directMessage.createMany({
      data: recipients.map((r) => ({ senderId: admin.id, recipientId: r.id, body }))
    });

    revalidatePath("/admin/messages");
    return { ok: true, data: { count: recipients.length } };
  } catch (e) {
    return toErr(e);
  }
}
