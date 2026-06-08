"use client";

import Link from "next/link";
import { PasswordResetForm } from "@/components/PasswordResetForms";
import { useLanguage } from "@/components/LanguageProvider";

export function ResetPasswordPageContent({ token }: { token?: string }) {
  const { t } = useLanguage();
  const hasToken = Boolean(token);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-xl content-center gap-6 px-5 py-10">
      <section className="grid gap-3 text-center">
        <img
          src="/poharana-icon-v3.svg"
          alt=""
          className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]"
        />
        <p className="pr-eyebrow">{t.resetPasswordPageEyebrow}</p>
        <h1 className="text-4xl font-[800] tracking-[-0.8px] text-[var(--ink)]">
          {hasToken ? t.resetPasswordPageTitle : t.resetPasswordInvalidTitle}
        </h1>
        <p className="pr-copy">
          {hasToken ? t.resetPasswordPageIntro : t.resetPasswordInvalidBody}
        </p>
      </section>

      {hasToken ? (
        <PasswordResetForm token={token!} />
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/forgot-login" className="pr-btn-primary">
            {t.requestResetLink}
          </Link>
          <Link href="/login" className="pr-btn-ghost">
            {t.backToSignIn}
          </Link>
        </div>
      )}
    </main>
  );
}
