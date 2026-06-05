"use client";

import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";
import { useLanguage } from "@/components/LanguageProvider";

function LoadingCard() {
  return <div className="pr-card p-6" aria-hidden="true" />;
}

export function RegisterPageContent({ googleOAuthEnabled = false }: { googleOAuthEnabled?: boolean }) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-xl content-center gap-6 px-5 py-10">
      <section className="grid gap-3 text-center">
        <img src="/poharana-icon-v3.svg" alt="" className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]" />
        <p className="pr-eyebrow">{t.joinKabulLearn}</p>
        <h1 className="text-4xl font-[800] tracking-[-0.8px] text-[var(--ink)]">{t.createYourAccount}</h1>
        <p className="pr-copy">
          {t.registerIntro}
        </p>
      </section>

      <Suspense fallback={<LoadingCard />}>
        <RegisterForm googleOAuthEnabled={googleOAuthEnabled} />
      </Suspense>

      <p className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4 text-center text-sm font-[600] leading-6 text-[var(--muted)]">
        {t.areYouEducator}{" "}
        <Link href="/login" className="font-[800] text-[var(--brand)] hover:underline">
          {t.signInWithEducatorAccount}
        </Link>
        {" "}{t.contactAdminForEducatorAccess}
      </p>
    </main>
  );
}
