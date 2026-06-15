"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerUser, type RegisterState } from "@/lib/actions/register-actions";
import { signInWithFacebook, signInWithGoogle } from "@/lib/actions/oauth-actions";
import { useLanguage } from "@/components/LanguageProvider";

const initialState: RegisterState = { error: "" };

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[#1877f2]">
      <path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.695 4.533-4.695 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.884v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.5 5.5A9 9 0 0 1 12 5c5.8 0 9 7 9 7a15.2 15.2 0 0 1-3.1 4.1M6.5 7.1A15 15 0 0 0 3 12s3.2 7 9 7c1.4 0 2.7-.4 3.8-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.7 10.7a3 3 0 0 0 3.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const socialButtonClass =
  "inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-[11px] border border-[var(--border)] bg-white px-3.5 text-[13px] font-[850] text-[var(--ink)] shadow-[0_6px_18px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.24)] hover:bg-[var(--surface)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)]";

export function RegisterForm({
  googleOAuthEnabled = false,
  facebookOAuthEnabled = false
}: {
  googleOAuthEnabled?: boolean;
  facebookOAuthEnabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);
  const { locale, t } = useLanguage();
  const oauthEnabled = googleOAuthEnabled || facebookOAuthEnabled;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const password = String(new FormData(form).get("password") || "");
        const confirmPassword = String(new FormData(form).get("confirmPassword") || "");
        if (password !== confirmPassword) {
          event.preventDefault();
          setPasswordMismatch(true);
        } else {
          setPasswordMismatch(false);
        }
      }}
      className="grid gap-3 rounded-[16px] border border-[var(--border)] bg-white/95 p-4 shadow-[0_18px_56px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      {oauthEnabled ? (
        <div className="grid gap-2">
          {googleOAuthEnabled ? (
            <button type="submit" formAction={signInWithGoogle} formNoValidate className={socialButtonClass}>
              <GoogleIcon />
              {t.continueWithGoogle}
            </button>
          ) : null}
          {facebookOAuthEnabled ? (
            <button type="submit" formAction={signInWithFacebook} formNoValidate className={socialButtonClass}>
              <FacebookIcon />
              {t.continueWithFacebook}
            </button>
          ) : null}
          <div className="px-1 text-center">
            <p className="text-[12.5px] font-[800] text-[var(--ink)]">{t.authTrustHeadline}</p>
            <p className="mt-0.5 text-[11.5px] font-[650] text-[var(--muted)]">{t.authTrustSubline}</p>
          </div>
        </div>
      ) : null}
      {oauthEnabled ? (
        <div className="flex items-center gap-3 py-0.5 text-[10.5px] font-[900] uppercase tracking-[1.4px] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          {t.or}
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
      ) : null}
      <label className="pr-label">
        {t.fullName}
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          className="pr-input h-10 px-3 py-2 text-[13px]"
        />
      </label>
      <label className="pr-label">
        {t.emailAddress}
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="pr-input h-10 px-3 py-2 text-[13px]"
        />
      </label>
      <label className="pr-label">
        {t.password}
        <span className="relative block">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="pr-input h-10 px-3 py-2 pe-10 text-[13px]"
            onChange={() => setPasswordMismatch(false)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 end-0 grid w-10 place-items-center rounded-e-[var(--radius)] text-[var(--muted)] transition hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)]"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            aria-pressed={showPassword}
          >
            <EyeIcon open={showPassword} />
          </button>
        </span>
        <span className="text-[11.5px] font-[700] text-[var(--muted)]">{t.passwordMin8}</span>
      </label>
      <label className="pr-label">
        {t.confirmPassword}
        <span className="relative block">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
            className="pr-input h-10 px-3 py-2 pe-10 text-[13px]"
            onChange={() => setPasswordMismatch(false)}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute inset-y-0 end-0 grid w-10 place-items-center rounded-e-[var(--radius)] text-[var(--muted)] transition hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)]"
            aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
            aria-pressed={showConfirmPassword}
          >
            <EyeIcon open={showConfirmPassword} />
          </button>
        </span>
      </label>

      {state.error ? (
        <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-3.5 py-2.5 text-[13px] font-[800] text-[var(--danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {passwordMismatch ? (
        <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-3.5 py-2.5 text-[13px] font-[800] text-[var(--danger)]" role="alert">
          {t.passwordMismatch}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="pr-btn-primary h-10 min-h-10 w-full px-4 text-[13px]"
      >
        {isPending ? t.creatingAccount : t.createAccount}
      </button>

      <p className="text-center text-[11.5px] font-[700] leading-5 text-[var(--muted)]">
        {t.registerAgreementPrefix}{" "}
        <Link href="/terms" className="font-[800] text-[var(--brand)] hover:underline">
          {t.termsOfUse}
        </Link>{" "}
        {t.registerAgreementJoiner}{" "}
        <Link href="/privacy" className="font-[800] text-[var(--brand)] hover:underline">
          {t.privacyPolicy}
        </Link>{" "}
        {t.registerAgreementSuffix}
      </p>

      <p className="text-center text-[13px] font-[700] text-[var(--muted)]">
        {t.alreadyHaveAccount}{" "}
        <Link href="/login" className="font-[800] text-[var(--brand)] hover:underline">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
