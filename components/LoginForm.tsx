"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/actions/login-actions";
import { signInWithFacebook, signInWithGoogle } from "@/lib/actions/oauth-actions";
import { useLanguage } from "@/components/LanguageProvider";

function SubmitButton({ portal }: { portal: "student" | "educator" | "admin" }) {
  const { pending } = useFormStatus();
  const { t } = useLanguage();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`pr-btn-primary h-10 min-h-10 w-full px-4 text-[13px] ${portal === "admin" ? "border-[#3b82f6] bg-[#3b82f6] shadow-[0_14px_34px_rgba(59,130,246,0.22)] hover:border-[#2563eb] hover:bg-[#2563eb]" : ""}`}
    >
      {pending ? t.signingIn : t.signIn}
    </button>
  );
}

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
  "inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-[11px] border border-[var(--border)] bg-[var(--card)] px-3.5 text-[13px] font-[850] text-[var(--ink)] shadow-[0_6px_18px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.24)] hover:bg-[var(--surface)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)]";

export function LoginForm({
  googleOAuthEnabled = false,
  facebookOAuthEnabled = false
}: {
  googleOAuthEnabled?: boolean;
  facebookOAuthEnabled?: boolean;
}) {
  const searchParams = useSearchParams();
  const { locale, t } = useLanguage();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const portal = callbackUrl.startsWith("/admin")
    ? "admin"
    : callbackUrl.startsWith("/educator")
      ? "educator"
      : "student";
  const [state, formAction] = useActionState(loginUser, { error: "" });
  const oauthEnabled = portal !== "admin" && (googleOAuthEnabled || facebookOAuthEnabled);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  const wrapperClass = `grid rounded-[16px] border shadow-[0_18px_56px_rgba(15,23,42,0.08)] ${
    portal === "admin"
      ? "gap-3 border-[#1f2a3d] bg-[#07111f] p-4 text-white shadow-[0_26px_80px_rgba(0,0,0,0.35)] sm:p-5"
      : portal === "educator"
        ? "gap-3 border-[rgba(24,130,92,0.18)] bg-[var(--card)] p-4 backdrop-blur sm:p-5"
        : "gap-3 border-[var(--border)] bg-[var(--card)] p-4 backdrop-blur sm:p-5"
  }`;

  return (
    <div className={wrapperClass}>
      {portal === "admin" ? (
        <div className="flex items-center gap-3 border-b border-[#1f2a3d] pb-4">
          <img
            src="/poharana-icon-v3.svg"
            alt=""
            className="h-10 w-10 rounded-[12px] shadow-[0_12px_28px_rgba(0,87,255,0.24)]"
          />
          <div>
            <p className="text-[11px] font-[800] uppercase tracking-[2.5px] text-[#8fb5ff]">
              KabulLearn
            </p>
            <h1 className="mt-1 text-[24px] font-[800] leading-none tracking-[-0.5px] text-white">
              {t.adminSignInTitle}
            </h1>
          </div>
        </div>
      ) : null}

      {/* OAuth buttons — each in its own form so they never nest inside the credentials form */}
      {oauthEnabled ? (
        <>
          <div className="grid gap-2">
            {googleOAuthEnabled ? (
              <form action={signInWithGoogle}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <input type="hidden" name="portal" value={portal} />
                <button type="submit" className={`${socialButtonClass} w-full`}>
                  <GoogleIcon />
                  {t.continueWithGoogle}
                </button>
              </form>
            ) : null}
            {facebookOAuthEnabled ? (
              <form action={signInWithFacebook}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <input type="hidden" name="portal" value={portal} />
                <button type="submit" className={`${socialButtonClass} w-full`}>
                  <FacebookIcon />
                  {t.continueWithFacebook}
                </button>
              </form>
            ) : null}
            <div className="px-1 text-center">
              <p className="text-[12.5px] font-[800] text-[var(--ink)]">{t.authTrustHeadline}</p>
              <p className="mt-0.5 text-[11.5px] font-[650] text-[var(--muted)]">{t.authTrustSubline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-0.5 text-[10.5px] font-[900] uppercase tracking-[1.4px] text-[var(--muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            {t.or}
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </>
      ) : null}

      {/* Credentials form — only submit button is Sign in, so Enter always triggers it */}
      <form action={formAction} className="contents">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="portal" value={portal} />
        <label className={`pr-label ${portal === "admin" ? "!text-[#d9e5f7]" : ""}`}>
          {portal === "admin" ? t.username : t.email}
          <input
            type="text"
            inputMode="email"
            name="email"
            autoComplete="username"
            required
            className={`pr-input h-10 px-3 py-2 text-[13px] ${portal === "admin" ? "border-[#26364f] bg-[#0b182b] text-white placeholder:text-[#6f7f99] focus:border-[#3b82f6] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.18)]" : ""}`}
          />
        </label>
        <label className={`pr-label ${portal === "admin" ? "!text-[#d9e5f7]" : ""}`}>
          {t.password}
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              className={`pr-input h-10 px-3 py-2 pe-10 text-[13px] ${portal === "admin" ? "border-[#26364f] bg-[#0b182b] text-white placeholder:text-[#6f7f99] focus:border-[#3b82f6] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.18)]" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className={`absolute inset-y-0 end-0 grid w-10 place-items-center rounded-e-[var(--radius)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)] ${
                portal === "admin" ? "text-[#9fb0c8] hover:text-white" : "text-[var(--muted)] hover:text-[var(--brand)]"
              }`}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
            >
              <EyeIcon open={showPassword} />
            </button>
          </span>
        </label>
        {state.error ? <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-3.5 py-2.5 text-[13px] font-[800] text-[var(--danger)]">{state.error}</p> : null}
        <SubmitButton portal={portal} />
      {portal !== "admin" ? (
        <a href="/forgot-login" className="text-center text-[13px] font-[800] text-[var(--brand)] hover:underline">
          {t.forgotPasswordOrEmail}
        </a>
      ) : null}
      </form>
    </div>
  );
}
