import Link from "next/link";

export default function ForgotLoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-3xl content-center gap-6 px-5 py-10">
      <section className="pr-panel p-7 text-center lg:p-10">
        <img
          src="/poharana-icon-v3.svg"
          alt=""
          className="mx-auto h-12 w-12 rounded-[14px] shadow-[0_12px_28px_rgba(0,87,255,0.18)]"
        />
        <p className="pr-eyebrow mt-5">Account recovery</p>
        <h1 className="pr-h1 mt-4">Forgot password or email?</h1>
        <p className="pr-copy mx-auto mt-5 max-w-2xl">
          Your KabulLearn username is the email address used when the account was created.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="pr-card p-6">
          <p className="pr-eyebrow">Forgot password</p>
          <h2 className="pr-h2 mt-3 text-[26px]">Ask an admin to reset it</h2>
          <p className="mt-4 text-sm font-[500] leading-7 text-[var(--muted)]">
            For now, password recovery is handled by an administrator. The admin can set a temporary password from the admin dashboard. After signing in, replace it with a private password.
          </p>
        </article>

        <article className="pr-card p-6">
          <p className="pr-eyebrow">Forgot email</p>
          <h2 className="pr-h2 mt-3 text-[26px]">Use your account email</h2>
          <p className="mt-4 text-sm font-[500] leading-7 text-[var(--muted)]">
            If you are unsure which email was used, contact the KabulLearn administrator with your full name and any likely email addresses so they can locate the account safely.
          </p>
        </article>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/login" className="pr-btn-primary">
          Back to sign in
        </Link>
        <Link href="/" className="pr-btn-ghost">
          Go home
        </Link>
      </div>
    </main>
  );
}
