import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { confirmPaidCourseCheckout } from "@/lib/stripe-course-payments";

export const runtime = "nodejs";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function markCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  const checkoutSessionId = session.id;
  const intentId = paymentIntentId(session);

  const payment = paymentId
    ? await db.payment.findUnique({ where: { id: paymentId } })
    : await db.payment.findUnique({ where: { stripeCheckoutSessionId: checkoutSessionId } });

  if (!payment) return;

  const updated = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      stripeCheckoutSessionId: checkoutSessionId,
      stripePaymentIntentId: intentId,
      donorEmail: session.customer_details?.email ?? payment.donorEmail,
      donorName: payment.donorName
    }
  });

  if (updated.purpose === "COURSE" && updated.userId && updated.courseId) {
    await confirmPaidCourseCheckout({
      sessionId: checkoutSessionId,
      userId: updated.userId,
      courseId: updated.courseId
    });

    revalidatePath(`/courses/${updated.courseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/my-courses");
  }

  if (updated.purpose === "DONATION") {
    revalidatePath("/support");
  }
}

async function markCheckoutSession(session: Stripe.Checkout.Session, status: "FAILED" | "EXPIRED") {
  const paymentId = session.metadata?.paymentId;
  if (paymentId) {
    await db.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status, stripeCheckoutSessionId: session.id }
    });
    return;
  }

  await db.payment.updateMany({
    where: { stripeCheckoutSessionId: session.id, status: "PENDING" },
    data: { status }
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await markCheckoutSessionPaid(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "checkout.session.async_payment_failed") {
      await markCheckoutSession(event.data.object as Stripe.Checkout.Session, "FAILED");
    }

    if (event.type === "checkout.session.expired") {
      await markCheckoutSession(event.data.object as Stripe.Checkout.Session, "EXPIRED");
    }
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ ok: false, error: "Webhook handling failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
