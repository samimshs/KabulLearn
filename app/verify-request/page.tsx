import Link from "next/link";

export default async function VerifyRequestPage({
  searchParams
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params?.email;

  return (
    <main className="pr-page grid min-h-[70vh] place-items-center">
      <section className="pr-panel max-w-xl p-8 text-center">
        <img src="/poharana-icon-v3.svg" alt="" className="mx-auto h-14 w-14 rounded-[16px]" />
        <p className="pr-eyebrow mt-6">Email verification</p>
        <h1 className="pr-h1 mt-4">Check your email</h1>
        <p className="pr-copy mt-5">
          We sent a verification link{email ? ` to ${email}` : ""}. Open it within 15 minutes to activate your KabulLearn account.
        </p>
        <Link href="/login" className="pr-btn-primary mt-8">
          Return to login
        </Link>
      </section>
    </main>
  );
}
