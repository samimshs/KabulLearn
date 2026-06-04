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

export function LoginPageContent() {
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
            <LoginForm />
          </Suspense>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-xl content-center gap-6 px-5 py-10">
      <section className="grid gap-3 text-center">
        <img src="/poharana-icon-v3.svg" alt="" className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]" />
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

      <Suspense fallback={<LoadingCard />}>
        <LoginForm />
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
