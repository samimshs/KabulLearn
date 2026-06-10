"use server";

import { db } from "@/lib/db";

/**
 * Called whenever a user completes a lesson or quiz.
 * - Same day   → no change
 * - Yesterday  → increment streak
 * - 2+ days ago → reset to 1
 * Uses @db.Date to compare calendar days in UTC.
 */
export async function updateUserStreak(userId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const existing = await db.userStreak.findUnique({ where: { userId } });

    if (!existing) {
      await db.userStreak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today }
      });
      return;
    }

    const last = new Date(existing.lastActiveDate);
    last.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);

    if (diffDays === 0) return; // already active today

    const current = diffDays === 1 ? existing.currentStreak + 1 : 1;
    const longest = Math.max(current, existing.longestStreak);

    await db.userStreak.update({
      where: { userId },
      data: { currentStreak: current, longestStreak: longest, lastActiveDate: today }
    });
  } catch {
    // streak update failing should never block lesson completion
  }
}

export async function getUserStreak(userId: string) {
  try {
    return await db.userStreak.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true, lastActiveDate: true }
    });
  } catch {
    return null;
  }
}
