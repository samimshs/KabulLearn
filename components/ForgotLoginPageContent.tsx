"use client";

import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/PasswordResetForms";
import { useLanguage } from "@/components/LanguageProvider";

export function ForgotLoginPageContent() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-3xl content-center gap-6 px-5 py-10">
      <section className="pr-panel p-7 text-center lg:p-10">
        <img
          src="/poharana-icon-v3.svg"
          alt=""
          className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]"
        />
        <p className="pr-eyebrow mt-5">{t.accountRecovery}</p>
        <h1 className="pr-h1 mt-4">{t.forgotLoginTitle}</h1>
        <p className="pr-copy mx-auto mt-5 max-w-2xl">{t.forgotLoginIntro}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="pr-card p-6">
          <p className="pr-eyebrow">{t.forgotPasswordOrEmail}</p>
          <h2 className="pr-h2 mt-3 text-[26px]">{t.forgotPasswordCardTitle}</h2>
          <p className="mt-4 text-sm font-[500] leading-7 text-[var(--muted)]">{t.forgotPasswordCardBody}</p>
          <div className="mt-5">
            <PasswordResetRequestForm />
          </div>
        </article>

        <article className="pr-card p-6">
          <p className="pr-eyebrow">{t.accountRecovery}</p>
          <h2 className="pr-h2 mt-3 text-[26px]">{t.forgotEmailCardTitle}</h2>
          <p className="mt-4 text-sm font-[500] leading-7 text-[var(--muted)]">{t.forgotEmailCardBody}</p>
          <a href="mailto:info@kabulhub.com" className="pr-btn-ghost mt-5 w-full">
            info@kabulhub.com
          </a>
        </article>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/login" className="pr-btn-primary">
          {t.backToSignIn}
        </Link>
        <Link href="/" className="pr-btn-ghost">
          {t.goHome}
        </Link>
      </div>
    </main>
  );
}
