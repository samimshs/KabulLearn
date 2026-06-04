"use client";

import { logout } from "@/lib/actions/auth-actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-[var(--radius)] px-3 text-[13px] font-[600] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
      >
        {/* → sign-out icon via unicode */}
        Sign out
      </button>
    </form>
  );
}
