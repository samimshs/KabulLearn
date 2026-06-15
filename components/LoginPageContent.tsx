"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { useLanguage } from "@/components/LanguageProvider";

function LoadingCard({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`rounded-[16px] border p-4 sm:p-5 ${
        dark ? "border-[#1f2a3d] bg-[#07111f]" : "border-[var(--border)] bg-[var(--card)]"
      }`}
      aria-hidden="true"
    />
  );
}

function StudentIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M11.5 2 14 4.5 5.5 13H3v-2.5L11.5 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function EducatorIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M10 3.5 2.8 7.2 10 11l7.2-3.8L10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.2 9.3v3.2c0 1.7 2.1 3 4.8 3s4.8-1.3 4.8-3V9.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LoginPageContent({
  googleOAuthEnabled = false,
  facebookOAuthEnabled = false
}: {
  googleOAuthEnabled?: boolean;
  facebookOAuthEnabled?: boolean;
}) {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const registered = searchParams.get("registered");
  const oauth = searchParams.get("oauth");
  const oauthError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const portal = callbackUrl.startsWith("/admin")
    ? "admin"
    : callbackUrl.startsWith("/educator")
      ? "educator"
      : "student";
  const isAdminLogin = portal === "admin";
  const isEducatorLogin = portal === "educator";
  const oauthErrorMessage =
    oauth === "not-configured"
      ? t.oauthNotConfigured
      : oauthError === "OAuthAccountNotLinked"
        ? t.oauthAccountNotLinked
        : oauthError === "AccessDenied"
          ? t.oauthAccessDenied
          : oauthError
            ? t.oauthSignInFailed
            : "";

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
      <main className="grid min-h-[calc(100vh-4rem)] w-full place-items-center bg-[var(--admin-login-bg)] px-4 py-4 sm:py-6">
        <section className="w-full max-w-[390px]">
          <div className="mb-7 flex flex-col items-center gap-3 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#07111f] shadow-[0_8px_28px_rgba(4,11,25,0.45)]">
              <svg viewBox="0 0 16 16" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M8 1.5 1.5 5v4.5C1.5 12.7 4.4 14.8 8 15.5c3.6-.7 6.5-2.8 6.5-6V5L8 1.5Z" stroke="#7ea7ff" strokeWidth="1.35" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-[900] uppercase tracking-[2.5px] text-[var(--muted)]">Admin Access</p>
              <h1 className="mt-1 text-[22px] font-[850] tracking-[-0.5px] text-[var(--ink)]">Platform Console</h1>
            </div>
          </div>
          <Suspense fallback={<LoadingCard />}>
            <LoginForm googleOAuthEnabled={googleOAuthEnabled} facebookOAuthEnabled={facebookOAuthEnabled} />
          </Suspense>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[520px] content-start gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:py-6">
      <section className="grid gap-1.5 text-center">
        <Link href="/"><img src="/poharana-icon-v3.svg" alt="KabulLearn home" className="mx-auto h-9 w-9 rounded-[12px] shadow-[0_10px_22px_rgba(0,87,255,0.16)]" /></Link>
        <p className="pr-eyebrow">{portalCopy.eyebrow}</p>
        <h1 className="text-[28px] font-[850] leading-tight tracking-[-0.7px] text-[var(--ink)] sm:text-[32px]">
          {portalCopy.title}
        </h1>
        <p className="mx-auto max-w-sm text-[13px] font-[650] leading-5 text-[var(--muted)]">
          {portalCopy.body}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-1.5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
        <Link
          href="/login"
          className={`flex min-h-[50px] items-center gap-2.5 rounded-[13px] px-2.5 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)] ${
            portal === "student"
              ? "bg-[var(--card)] text-[var(--ink)] shadow-[0_10px_28px_rgba(0,87,255,0.12)] ring-1 ring-[rgba(0,87,255,0.14)]"
              : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--ink)]"
          }`}
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${portal === "student" ? "bg-[var(--brand)] text-white" : "bg-[var(--card)] text-[var(--brand)] ring-1 ring-[var(--border)]"}`}>
            <StudentIcon />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-[900]">{t.studentPortalLabel}</span>
            <span className="block truncate text-[10.5px] font-[700] opacity-75">{t.studentPortalDesc}</span>
          </span>
        </Link>
        <Link
          href="/login?callbackUrl=%2Feducator"
          className={`flex min-h-[50px] items-center gap-2.5 rounded-[13px] px-2.5 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.16)] ${
            portal === "educator"
              ? "bg-[var(--card)] text-[var(--ink)] shadow-[0_10px_28px_rgba(24,130,92,0.12)] ring-1 ring-[rgba(24,130,92,0.16)]"
              : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--ink)]"
          }`}
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${portal === "educator" ? "bg-[var(--success)] text-white" : "bg-[var(--card)] text-[var(--success)] ring-1 ring-[var(--border)]"}`}>
            <EducatorIcon />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-[900]">{t.educatorPortalLabel}</span>
            <span className="block truncate text-[10.5px] font-[700] opacity-75">{t.educatorPortalDesc}</span>
          </span>
        </Link>
      </div>

      {registered ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-4 py-3 text-center text-[13px] font-[800] text-[var(--success)]">
          {t.accountCreatedSignIn}
        </div>
      ) : null}
      {oauthErrorMessage ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(196,43,43,0.2)] bg-[var(--danger-50)] px-4 py-3 text-center text-[13px] font-[800] text-[var(--danger)]">
          {oauthErrorMessage}
        </div>
      ) : null}

      {/* How to become an educator — shown only on the educator login tab */}
      {isEducatorLogin && (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(0,87,255,0.12)] bg-[var(--brand-50)] px-4 py-4">
          <p className="mb-3 text-[12.5px] font-[600] leading-5 text-[var(--ink-2)]">
            {t.educatorOnboardingIntro}
          </p>
          <ol className="grid gap-2.5">
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
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--card)] text-[var(--brand)] shadow-sm ring-1 ring-[rgba(0,87,255,0.12)]">
                  {step.icon}
                </span>
                <span className="text-[12.5px] font-[700] text-[var(--ink)]">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <Suspense fallback={<LoadingCard />}>
          <LoginForm googleOAuthEnabled={googleOAuthEnabled} facebookOAuthEnabled={facebookOAuthEnabled} />
      </Suspense>

      {isEducatorLogin ? (
        <p className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-center text-[13px] font-[650] leading-5 text-[var(--muted)] shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
          {t.educatorNoAccount}{" "}
          <Link href="/register" className="font-[800] text-[var(--brand)] hover:underline">
            {t.registerAsStudent}
          </Link>{" "}
          {t.educatorAccessAfterRegister}
        </p>
      ) : (
        <p className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-center text-[13px] font-[700] text-[var(--muted)] shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
          {t.newToKabulLearn}{" "}
          <Link href="/register" className="font-[900] text-[var(--brand)] hover:underline">
            {t.createFreeStudentAccount}
          </Link>
        </p>
      )}
    </main>
  );
}
