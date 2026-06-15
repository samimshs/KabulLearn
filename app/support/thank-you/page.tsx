import Link from "next/link";
import { db } from "@/lib/db";
import { dictionaries } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";
import { getStripe } from "@/lib/stripe";

export const metadata = {
  title: "Thank you for supporting KabulLearn",
  description: "A thank-you message for KabulLearn supporters."
};

async function verifyDonationPayment(sessionId: string | undefined) {
  if (!sessionId) return false;

  try {
    const existing = await db.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      select: { id: true, purpose: true, status: true }
    });

    if (existing?.purpose === "DONATION" && existing.status === "PAID") {
      return true;
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.purpose !== "DONATION") {
      return false;
    }

    if (session.payment_status !== "paid") {
      return false;
    }

    const paymentId = session.metadata?.paymentId;
    const payment = paymentId
      ? await db.payment.findFirst({ where: { id: paymentId, purpose: "DONATION" } })
      : await db.payment.findFirst({ where: { stripeCheckoutSessionId: sessionId, purpose: "DONATION" } });

    if (!payment) {
      return false;
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        donorEmail: payment.donorEmail ?? session.customer_details?.email ?? undefined,
        donorName: payment.donorName
      }
    });

    return true;
  } catch {
    return false;
  }
}

export default async function DonationThankYouPage({
  searchParams
}: {
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const locale = await getServerLocale();
  const t = dictionaries[locale];
  const params = await searchParams;
  const paymentConfirmed = await verifyDonationPayment(params?.session_id);

  return (
    <main className="pr-page py-12 lg:py-20">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="bg-[linear-gradient(135deg,rgba(0,87,255,0.10),rgba(24,130,92,0.10))] px-6 py-10 text-center sm:px-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--card)] text-[var(--brand)] shadow-[var(--shadow-sm)]" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="pr-eyebrow mt-6">{paymentConfirmed ? t.donationThankYouEyebrow : t.donationPendingEyebrow}</p>
          <h1 className="mt-3 text-[clamp(28px,4vw,44px)] font-[900] leading-tight tracking-[-0.8px] text-[var(--ink)]">
            {paymentConfirmed ? t.donationThankYouTitle : t.donationPendingTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] font-[600] leading-8 text-[var(--ink-2)]">
            {paymentConfirmed ? t.donationThankYouIntro : t.donationPendingBody}
          </p>
        </div>

        <div className="grid gap-6 px-6 py-8 sm:px-10">
          {paymentConfirmed ? (
            <>
              <div className="rounded-[var(--radius-lg)] border border-[rgba(0,87,255,0.12)] bg-[var(--brand-50)] p-5">
                <h2 className="text-[18px] font-[900] text-[var(--ink)]">{t.donationUsedForTitle}</h2>
                <ul className="mt-4 grid gap-3">
                  {[
                    t.donationUseCourseCreation,
                    t.donationUseEducators,
                    t.donationUseMaintenance,
                    t.donationUseAccess
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-[14px] font-[700] leading-6 text-[var(--ink-2)]">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[15px] font-[600] leading-8 text-[var(--muted)]">
                {t.donationThankYouClosing}
              </p>
            </>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-5">
              <p className="text-[14px] font-[700] leading-7 text-[var(--warning)]">{t.donationPendingHint}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/courses" className="pr-btn-primary justify-center">
              {t.backToCourses}
            </Link>
            <Link href="/support" className="pr-btn-ghost justify-center">
              {t.supportAgain}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
