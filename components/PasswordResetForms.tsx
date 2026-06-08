"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordReset,
  resetPassword,
  type PasswordResetRequestState,
  type PasswordResetState
} from "@/lib/actions/password-reset-actions";
import { useLanguage } from "@/components/LanguageProvider";

const requestInitialState: PasswordResetRequestState = { error: "", success: false };
const resetInitialState: PasswordResetState = { error: "", success: false };

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();

  return (
    <button type="submit" disabled={status.pending} className="pr-btn-primary w-full">
      {status.pending ? pending : idle}
    </button>
  );
}

export function PasswordResetRequestForm() {
  const { locale, t } = useLanguage();
  const [state, formAction] = useActionState(requestPasswordReset, requestInitialState);

  if (state.success) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] p-5">
        <h2 className="text-lg font-[800] text-[var(--success)]">{t.resetRequestSuccessTitle}</h2>
        <p className="mt-2 text-sm font-[700] leading-6 text-[var(--ink-2)]">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <label className="pr-label">
        {t.resetEmailLabel}
        <input type="email" name="email" autoComplete="email" required className="pr-input" />
      </label>

      {state.error ? (
        <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[800] text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton idle={t.requestResetLink} pending={t.requestingResetLink} />
    </form>
  );
}

export function PasswordResetForm({ token }: { token: string }) {
  const { locale, t } = useLanguage();
  const [state, formAction] = useActionState(resetPassword, resetInitialState);

  if (state.success) {
    return (
      <div className="pr-card p-6 text-center">
        <h2 className="text-2xl font-[800] text-[var(--success)]">{t.passwordResetSuccessTitle}</h2>
        <p className="mt-3 text-sm font-[700] leading-6 text-[var(--muted)]">{state.message}</p>
        <Link href="/login" className="pr-btn-primary mt-6">
          {t.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="pr-card grid gap-4 p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />

      <label className="pr-label">
        {t.newPassword}
        <input type="password" name="password" autoComplete="new-password" required minLength={8} className="pr-input" />
        <span className="text-xs font-[700] text-[var(--muted)]">{t.passwordMin8}</span>
      </label>

      <label className="pr-label">
        {t.confirmPassword}
        <input type="password" name="confirmPassword" autoComplete="new-password" required minLength={8} className="pr-input" />
      </label>

      {state.error ? (
        <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[800] text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton idle={t.resetPasswordButton} pending={t.resettingPassword} />
    </form>
  );
}
