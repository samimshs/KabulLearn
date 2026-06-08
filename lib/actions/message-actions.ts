"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ConversationSummary = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export type ConversationMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong." };
}

const sendSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().trim().min(1, "Message cannot be empty.").max(4000)
});

function canDirectMessage(senderRole: string, recipientRole: string) {
  if (senderRole === UserRole.ADMIN) return true; // admin can send to anyone (system messages)
  return (
    (senderRole === UserRole.STUDENT && recipientRole === UserRole.EDUCATOR) ||
    (senderRole === UserRole.EDUCATOR && recipientRole === UserRole.STUDENT)
  );
}

/** Creates a system/admin message directly in the DB without role-permission checks. */
export async function createSystemInboxMessage(recipientId: string, senderId: string, body: string) {
  await db.directMessage.create({ data: { senderId, recipientId, body } });
}

/** Send a direct message to another user. */
export async function sendDirectMessage(input: z.infer<typeof sendSchema>): Promise<ActionResult<ConversationMessage>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("You must be signed in to send messages.");

    const { recipientId, body } = sendSchema.parse(input);
    if (recipientId === session.user.id) throw new Error("You cannot message yourself.");

    const [sender, recipient] = await Promise.all([
      db.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } }),
      db.user.findUnique({ where: { id: recipientId }, select: { id: true, role: true } })
    ]);
    if (!sender) throw new Error("You must be signed in to send messages.");
    if (!recipient) throw new Error("Recipient not found.");
    if (!canDirectMessage(sender.role, recipient.role)) {
      throw new Error("Direct messages are only available between learners and educators.");
    }

    const message = await db.directMessage.create({
      data: { senderId: session.user.id, recipientId, body },
      select: { id: true, body: true, createdAt: true }
    });

    revalidatePath("/dashboard/messages");
    revalidatePath("/educator/messages");

    return {
      ok: true,
      data: { id: message.id, body: message.body, mine: true, createdAt: message.createdAt.toISOString() }
    };
  } catch (error) {
    return toActionError(error);
  }
}

/** Returns one summary per conversation partner, newest first. */
export async function getInbox(): Promise<ConversationSummary[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const me = session.user.id;

  const [currentUser, messages] = await Promise.all([
    db.user.findUnique({ where: { id: me }, select: { role: true } }),
    db.directMessage.findMany({
      where: { OR: [{ senderId: me }, { recipientId: me }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, body: true, senderId: true, recipientId: true, readAt: true, createdAt: true,
        sender: { select: { id: true, name: true, email: true, image: true, role: true } },
        recipient: { select: { id: true, name: true, email: true, image: true, role: true } }
      }
    })
  ]);
  if (!currentUser) return [];

  const byPartner = new Map<string, ConversationSummary>();
  for (const m of messages) {
    const partner = m.senderId === me ? m.recipient : m.sender;
    if (!canDirectMessage(currentUser.role, partner.role) && !canDirectMessage(partner.role, currentUser.role)) continue;
    const existing = byPartner.get(partner.id);
    const isUnread = m.recipientId === me && m.readAt === null;

    if (!existing) {
      byPartner.set(partner.id, {
        userId: partner.id,
        name: partner.name ?? partner.email,
        avatarUrl: partner.image ?? null,
        role: partner.role,
        lastMessage: m.body,
        lastAt: m.createdAt.toISOString(),
        unread: isUnread ? 1 : 0
      });
    } else if (isUnread) {
      existing.unread += 1;
    }
  }

  return Array.from(byPartner.values());
}

const conversationSchema = z.object({ otherUserId: z.string().min(1) });

/** Full message thread with a partner. Marks their messages to me as read. */
export async function getConversation(input: z.infer<typeof conversationSchema>): Promise<{
  partner: { userId: string; name: string; avatarUrl: string | null; role: string } | null;
  messages: ConversationMessage[];
}> {
  const session = await auth();
  if (!session?.user?.id) return { partner: null, messages: [] };
  const me = session.user.id;
  const { otherUserId } = conversationSchema.parse(input);

  const [currentUser, partner] = await Promise.all([
    db.user.findUnique({ where: { id: me }, select: { role: true } }),
    db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true, email: true, image: true, role: true }
    })
  ]);
  if (!currentUser || !partner) return { partner: null, messages: [] };
  if (!canDirectMessage(currentUser.role, partner.role) && !canDirectMessage(partner.role, currentUser.role)) return { partner: null, messages: [] };

  const rows = await db.directMessage.findMany({
    where: {
      OR: [
        { senderId: me, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: me }
      ]
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, senderId: true, createdAt: true }
  });

  // Mark their messages to me as read
  await db.directMessage.updateMany({
    where: { senderId: otherUserId, recipientId: me, readAt: null },
    data: { readAt: new Date() }
  });

  return {
    partner: {
      userId: partner.id,
      name: partner.name ?? partner.email,
      avatarUrl: partner.image ?? null,
      role: partner.role
    },
    messages: rows.map((r) => ({
      id: r.id,
      body: r.body,
      mine: r.senderId === me,
      createdAt: r.createdAt.toISOString()
    }))
  };
}

/** Total unread message count for the header badge. */
export async function getUnreadMessageCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  const currentUser = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!currentUser) return 0;

  const rows = await db.directMessage.findMany({
    where: { recipientId: session.user.id, readAt: null },
    select: { sender: { select: { role: true } } }
  });

  return rows.filter((row) => canDirectMessage(currentUser.role, row.sender.role) || canDirectMessage(row.sender.role, currentUser.role)).length;
}
