"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/actions/login-actions";
import { signInWithGoogle } from "@/lib/actions/oauth-actions";
import { useLanguage } from "@/components/LanguageProvider";

function SubmitButton({ portal }: { portal: "student" | "educator" | "admin" }) {
  const { pending } = useFormStatus();
  const { t } = useLanguage();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`pr-btn-primary mt-2 w-full ${portal === "admin" ? "border-[#3b82f6] bg-[#3b82f6] shadow-[0_14px_34px_rgba(59,130,246,0.22)] hover:border-[#2563eb] hover:bg-[#2563eb]" : ""}`}
    >
      {pending ? t.signingIn : t.signIn}
    </button>
  );
}

export function LoginForm({ googleOAuthEnabled = false }: { googleOAuthEnabled?: boolean }) {
  const searchParams = useSearchParams();
  const { locale, t } = useLanguage();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const portal = callbackUrl.startsWith("/admin")
    ? "admin"
    : callbackUrl.startsWith("/educator")
      ? "educator"
      : "student";
  const [state, formAction] = useActionState(loginUser, { error: "" });

  useEffect(() => {
    if (state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  return (
    <form
      action={formAction}
      className={`grid rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)] ${
        portal === "admin"
          ? "gap-5 border-[#1f2a3d] bg-[#07111f] p-7 text-white shadow-[0_26px_80px_rgba(0,0,0,0.35)]"
          : portal === "educator"
            ? "gap-4 border-[rgba(24,130,92,0.18)] bg-white p-6"
            : "gap-4 border-[var(--border)] bg-white p-6"
      }`}
    >
      {portal === "admin" ? (
        <div className="mb-1 flex items-center gap-3 border-b border-[#1f2a3d] pb-5">
          <img
            src="/poharana-icon-v3.svg"
            alt=""
            className="h-11 w-11 rounded-[13px] shadow-[0_12px_28px_rgba(0,87,255,0.24)]"
          />
          <div>
            <p className="text-[11px] font-[800] uppercase tracking-[2.5px] text-[#8fb5ff]">
              KabulLearn
            </p>
            <h1 className="mt-1 text-[28px] font-[800] leading-none tracking-[-0.6px] text-white">
              {t.adminSignInTitle}
            </h1>
          </div>
        </div>
      ) : null}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="portal" value={portal} />
      <label className={`pr-label ${portal === "admin" ? "text-[#d9e5f7]" : ""}`}>
        {portal === "admin" ? t.username : t.email}
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className={`pr-input ${portal === "admin" ? "border-[#26364f] bg-[#0b182b] text-white placeholder:text-[#6f7f99] focus:border-[#3b82f6] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.18)]" : ""}`}
        />
      </label>
      <label className={`pr-label ${portal === "admin" ? "text-[#d9e5f7]" : ""}`}>
        {t.password}
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className={`pr-input ${portal === "admin" ? "border-[#26364f] bg-[#0b182b] text-white placeholder:text-[#6f7f99] focus:border-[#3b82f6] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.18)]" : ""}`}
        />
      </label>
      {state.error ? <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[800] text-[var(--danger)]">{state.error}</p> : null}
      <SubmitButton portal={portal} />
      {portal !== "admin" && googleOAuthEnabled ? (
        <>
          <div className="flex items-center gap-3 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            {t.or}
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <button
            type="submit"
            formAction={signInWithGoogle}
            formNoValidate
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 text-sm font-[800] text-[var(--ink)] shadow-sm transition hover:border-[rgba(0,87,255,0.28)] hover:bg-[var(--surface)]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
            </svg>
            {t.continueWithGoogle}
          </button>
        </>
      ) : null}
      {portal !== "admin" ? (
        <a href="/forgot-login" className="text-center text-sm font-[800] text-[var(--brand)] hover:underline">
          {t.forgotPasswordOrEmail}
        </a>
      ) : null}
    </form>
  );
}
