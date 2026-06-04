import { Suspense } from "react";
import { RegisterForm } from "@/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-xl content-center gap-6 px-5 py-10">
      <section className="grid gap-3 text-center">
        <img src="/poharana-icon-v3.svg" alt="" className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]" />
        <p className="pr-eyebrow">Join KabulLearn</p>
        <h1 className="text-4xl font-[800] tracking-[-0.8px] text-[var(--ink)]">Create your account</h1>
        <p className="pr-copy">
          Free access to all published courses. Track your progress and earn certificates.
        </p>
      </section>

      <Suspense fallback={<div className="pr-card p-6 text-center font-[800] text-[var(--muted)]">Loading...</div>}>
        <RegisterForm />
      </Suspense>

      <p className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4 text-center text-sm font-[600] leading-6 text-[var(--muted)]">
        Are you an educator?{" "}
        <Link href="/login" className="font-[800] text-[var(--brand)] hover:underline">
          Sign in with your educator account
        </Link>
        {" "}or contact the admin to get educator access after registering.
      </p>
    </main>
  );
}
