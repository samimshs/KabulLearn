import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
}) {
  const { registered, callbackUrl } = await searchParams;
  const portal = callbackUrl?.startsWith("/admin")
    ? "admin"
    : callbackUrl?.startsWith("/educator")
      ? "educator"
      : "student";
  const isAdminLogin = portal === "admin";
  const isEducatorLogin = portal === "educator";

  const portalCopy = {
    admin: {
      eyebrow: "KabulLearn",
      title: "Admin sign in",
      body: ""
    },
    educator: {
      eyebrow: "Educator workspace",
      title: "Creator sign in",
      body: "Access your course creation portal, manage drafts, and prepare lessons for review."
    },
    student: {
      eyebrow: "KabulLearn",
      title: "Student sign in",
      body: "Welcome back. Sign in to continue learning."
    }
  }[portal];

  if (isAdminLogin) {
    return (
      <main className="grid min-h-[calc(100vh-4rem)] w-full place-items-center bg-[#05070b] px-5 py-10">
        <section className="w-full max-w-[420px]">
          <Suspense fallback={<div className="rounded-[var(--radius-lg)] border border-[#1f2a3d] bg-[#07111f] p-6 text-center font-[800] text-[#9fb4d3]">Loading...</div>}>
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

      {/* Role tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1.5">
        <Link
          href="/login"
          className={`inline-flex h-10 items-center justify-center rounded-[var(--radius)] text-sm font-[800] transition ${
            portal === "student"
              ? "bg-white text-[var(--ink)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Student
        </Link>
        <Link
          href="/login?callbackUrl=%2Feducator"
          className={`inline-flex h-10 items-center justify-center rounded-[var(--radius)] text-sm font-[800] transition ${
            portal === "educator"
              ? "bg-white text-[var(--ink)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Educator
        </Link>
        <Link
          href="/login?callbackUrl=%2Fadmin"
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] text-sm font-[800] text-[var(--muted)] transition hover:text-[var(--ink)]"
        >
          Admin
        </Link>
      </div>

      {registered ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-5 py-4 text-center text-sm font-[800] text-[var(--success)]">
          Account created! Sign in with your new credentials.
        </div>
      ) : null}

      <Suspense fallback={<div className="pr-card p-6 text-center font-[800] text-[var(--muted)]">Loading...</div>}>
        <LoginForm />
      </Suspense>

      {isEducatorLogin ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4 text-center text-sm font-[600] leading-6 text-[var(--muted)]">
          Don&apos;t have an educator account yet?{" "}
          <Link href="/register" className="font-[800] text-[var(--brand)] hover:underline">
            Register as a student
          </Link>{" "}
          then contact the admin to receive educator access.
        </p>
      ) : (
        <p className="text-center text-sm font-[700] text-[var(--muted)]">
          New to KabulLearn?{" "}
          <Link href="/register" className="font-[800] text-[var(--brand)] hover:underline">
            Create a free student account
          </Link>
        </p>
      )}
    </main>
  );
}
