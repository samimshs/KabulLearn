"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { useLanguage } from "@/components/LanguageProvider";

function LoadingCard({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-6 ${
        dark ? "border-[#1f2a3d] bg-[#07111f]" : "border-[var(--border)] bg-white"
      }`}
      aria-hidden="true"
    />
  );
}

export function LoginPageContent({ googleOAuthEnabled = false }: { googleOAuthEnabled?: boolean }) {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const portal = callbackUrl.startsWith("/admin")
    ? "admin"
    : callbackUrl.startsWith("/educator")
      ? "educator"
      : "student";
  const isAdminLogin = portal === "admin";
  const isEducatorLogin = portal === "educator";

  const portalCopy = {
    admin: {
      eyebrow: t.appName,
      title: t.adminSignInTitle,
      body: ""
    },
    educator: {
      eyebrow: t.educatorWorkspace,
      title: t.creatorSignInTitle,
      body: t.educatorSignInBody
    },
    student: {
      eyebrow: t.appName,
      title: t.studentSignInTitle,
      body: t.studentSignInBody
    }
  }[portal];

  if (isAdminLogin) {
    return (
      <main className="grid min-h-[calc(100vh-4rem)] w-full place-items-center bg-[#05070b] px-5 py-10">
        <section className="w-full max-w-[420px]">
          <Suspense fallback={<LoadingCard dark />}>
            <LoginForm googleOAuthEnabled={googleOAuthEnabled} />
          </Suspense>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-xl content-center gap-6 px-5 py-10">
      <section className="grid gap-3 text-center">
        <Link href="/"><img src="/poharana-icon-v3.svg" alt="KabulLearn home" className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]" /></Link>
        <p className="pr-eyebrow">{portalCopy.eyebrow}</p>
        <h1 className="text-4xl font-[800] tracking-[-0.8px] text-[var(--ink)]">
          {portalCopy.title}
        </h1>
        <p className="pr-copy">
          {portalCopy.body}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1.5">
        <Link
          href="/login"
          className={`inline-flex h-10 items-center justify-center rounded-[var(--radius)] text-sm font-[800] transition ${
            portal === "student"
              ? "bg-white text-[var(--ink)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          {t.student}
        </Link>
        <Link
          href="/login?callbackUrl=%2Feducator"
          className={`inline-flex h-10 items-center justify-center rounded-[var(--radius)] text-sm font-[800] transition ${
            portal === "educator"
              ? "bg-white text-[var(--ink)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          {t.educator}
        </Link>
      </div>

      {registered ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-5 py-4 text-center text-sm font-[800] text-[var(--success)]">
          {t.accountCreatedSignIn}
        </div>
      ) : null}

      {/* How to become an educator — shown only on the educator login tab */}
      {isEducatorLogin && (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(0,87,255,0.12)] bg-[var(--brand-50)] px-5 py-5">
          <p className="mb-4 text-[13px] font-[600] leading-relaxed text-[var(--ink-2)]">
            {t.educatorOnboardingIntro}
          </p>
          <ol className="grid gap-3">
            {[
              {
                text: t.educatorOnboardingStep1,
                icon: (
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
                    <circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2.5 13.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                text: t.educatorOnboardingStep2,
                icon: (
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
                    <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="8" cy="10" r="1.2" fill="currentColor" />
                  </svg>
                ),
              },
              {
                text: t.educatorOnboardingStep3,
                icon: (
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M8 2.5C6.5 1.5 3.8 1.4 2.2 2v9c1.6-.6 4.3-.5 5.8.7M8 2.5c1.5-1 4.2-1.1 5.8-.5v9c-1.6-.6-4.3-.5-5.8.7M8 2.5v9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                text: t.educatorOnboardingStep4,
                icon: (
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M2.5 8.5 6 12l7.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[var(--brand)] shadow-sm ring-1 ring-[rgba(0,87,255,0.12)]">
                  {step.icon}
                </span>
                <span className="text-[13px] font-[700] text-[var(--ink)]">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <Suspense fallback={<LoadingCard />}>
          <LoginForm googleOAuthEnabled={googleOAuthEnabled} />
      </Suspense>

      {isEducatorLogin ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4 text-center text-sm font-[600] leading-6 text-[var(--muted)]">
          {t.educatorNoAccount}{" "}
          <Link href="/register" className="font-[800] text-[var(--brand)] hover:underline">
            {t.registerAsStudent}
          </Link>{" "}
          {t.educatorAccessAfterRegister}
        </p>
      ) : (
        <p className="text-center text-sm font-[700] text-[var(--muted)]">
          {t.newToKabulLearn}{" "}
          <Link href="/register" className="font-[800] text-[var(--brand)] hover:underline">
            {t.createFreeStudentAccount}
          </Link>
        </p>
      )}
    </main>
  );
}
