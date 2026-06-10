"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.appNotification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() }
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.appNotification.updateMany({
    where: { id, userId: session.user.id },
    data: { readAt: new Date() }
  });
}
