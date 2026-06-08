"use client";

import { useEffect } from "react";

const SESSION_UID_KEY = "kabullearn.session.uid";

/**
 * Clears all user-specific localStorage keys when the active user changes.
 * Covers: avatar, unread count, quiz progress, lesson visit history.
 * Must receive the server-authoritative userId on every render so it catches
 * both login-switches (A → B) and logout-then-new-login (A → null → B).
 */
export function SessionGuard({ userId }: { userId: string | null }) {
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_UID_KEY) ?? null;
    const current = userId ?? null;

    if (stored === current) return; // same user, nothing to clear

    // User changed — purge all user-scoped keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith("kabullearn.portal.") ||
        key.startsWith("poharana:")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Record the new user (or null if logged out)
    if (current) {
      localStorage.setItem(SESSION_UID_KEY, current);
    } else {
      localStorage.removeItem(SESSION_UID_KEY);
    }
  }, [userId]);

  return null;
}
