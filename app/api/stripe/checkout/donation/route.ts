import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRequestOrigin, getStripe } from "@/lib/stripe";

const donationSchema = z.object({
  amountCents: z.number().int().min(100).max(1000000),
  donorName: z.string().trim().max(120).optional(),
  donorEmail: z.string().trim().email().optional()
});

export async function POST(request: Request) {
  const parsed = donationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Choose a valid donation amount." }, { status: 400 });
  }

  const session = await auth();
  const stripe = getStripe();
  const origin = getRequestOrigin(request);
  const donorEmail = parsed.data.donorEmail || session?.user?.email || undefined;
  const donorName = parsed.data.donorName || session?.user?.name || undefined;

  const payment = await db.payment.create({
    data: {
      purpose: "DONATION",
      status: "PENDING",
      amountCents: parsed.data.amountCents,
      currency: "usd",
      userId: session?.user?.id ?? null,
      donorEmail: donorEmail ?? null,
      donorName: donorName ?? null
    },
    select: { id: true }
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: payment.id,
    customer_email: donorEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: parsed.data.amountCents,
          product_data: {
            name: "KabulLearn donation",
            description: "Support practical education in English, Pashto, and Dari"
          }
        }
      }
    ],
    metadata: {
      paymentId: payment.id,
      purpose: "DONATION"
    },
    payment_intent_data: {
      metadata: {
        paymentId: payment.id,
        purpose: "DONATION"
      }
    },
    success_url: `${origin}/support/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/support?donation=cancelled`
  });

  await db.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: checkout.id }
  });

  return NextResponse.json({ ok: true, data: { url: checkout.url } });
}
