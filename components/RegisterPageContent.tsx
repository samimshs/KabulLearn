"use client";

import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";
import { useLanguage } from "@/components/LanguageProvider";

function LoadingCard() {
  return <div className="rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5" aria-hidden="true" />;
}

export function RegisterPageContent({
  googleOAuthEnabled = false,
  facebookOAuthEnabled = false
}: {
  googleOAuthEnabled?: boolean;
  facebookOAuthEnabled?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[520px] content-start gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:py-6">
      <section className="grid gap-1.5 text-center">
        <Link href="/"><img src="/poharana-icon-v3.svg" alt="KabulLearn home" className="mx-auto h-9 w-9 rounded-[12px] shadow-[0_10px_22px_rgba(0,87,255,0.16)]" /></Link>
        <p className="pr-eyebrow">{t.joinKabulLearn}</p>
        <h1 className="text-[28px] font-[850] leading-tight tracking-[-0.7px] text-[var(--ink)] sm:text-[32px]">{t.createYourAccount}</h1>
        <p className="mx-auto max-w-sm text-[13px] font-[650] leading-5 text-[var(--muted)]">
          {t.registerIntro}
        </p>
      </section>

      <Suspense fallback={<LoadingCard />}>
        <RegisterForm googleOAuthEnabled={googleOAuthEnabled} facebookOAuthEnabled={facebookOAuthEnabled} />
      </Suspense>

      <p className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-2.5 text-center text-[13px] font-[650] leading-5 text-[var(--muted)] shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        {t.areYouEducator}{" "}
        <Link href="/login" className="font-[800] text-[var(--brand)] hover:underline">
          {t.signInWithEducatorAccount}
        </Link>
        {" "}{t.contactAdminForEducatorAccess}
      </p>
    </main>
  );
}
