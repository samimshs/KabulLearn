import type Stripe from "stripe";
import { db } from "@/lib/db";
import { appBaseUrl, sendCoursePurchaseThankYouEmail } from "@/lib/email-verification";
import { getStripe } from "@/lib/stripe";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function sendPurchaseThankYouEmail(input: {
  paymentId: string;
  userId: string;
  courseId: string;
}) {
  const [user, course] = await Promise.all([
    db.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true }
    }),
    db.course.findUnique({
      where: { id: input.courseId },
      select: { slug: true, titleEn: true, titlePs: true, titleDa: true }
    })
  ]);

  if (!user?.email || !course) return;

  await sendCoursePurchaseThankYouEmail({
    email: user.email,
    name: user.name,
    courseTitleEn: course.titleEn,
    courseTitlePs: course.titlePs,
    courseTitleDa: course.titleDa,
    courseUrl: `${appBaseUrl()}/courses/${encodeURIComponent(course.slug || input.courseId)}`,
    paymentId: input.paymentId
  }).catch((error) => {
    console.error("Course purchase thank-you email failed:", error);
  });
}

async function finalizePaidCourseSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return false;
  if (session.metadata?.purpose !== "COURSE") return false;

  const paymentId = session.metadata.paymentId;
  const userId = session.metadata.userId;
  const courseId = session.metadata.courseId;
  if (!userId || !courseId) return false;

  const payment = paymentId
    ? await db.payment.findUnique({ where: { id: paymentId } })
    : await db.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });

  if (!payment || payment.purpose !== "COURSE") return false;
  if (payment.userId !== userId || payment.courseId !== courseId) return false;

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId(session),
      donorEmail: session.customer_details?.email ?? payment.donorEmail,
      donorName: payment.donorName
    }
  });

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId }
  });

  await sendPurchaseThankYouEmail({ paymentId: payment.id, userId, courseId });

  return true;
}

export async function confirmPaidCourseCheckout(input: {
  sessionId: string | undefined;
  userId: string;
  courseId: string;
}) {
  if (!input.sessionId || !input.sessionId.startsWith("cs_")) return false;

  const session = await getStripe().checkout.sessions.retrieve(input.sessionId, {
    expand: ["payment_intent"]
  });

  if (session.metadata?.userId !== input.userId || session.metadata?.courseId !== input.courseId) {
    return false;
  }

  return finalizePaidCourseSession(session);
}

export async function confirmLatestPaidCourseCheckout(input: {
  userId: string;
  courseId: string;
}) {
  const payment = await db.payment.findFirst({
    where: {
      purpose: "COURSE",
      status: "PENDING",
      userId: input.userId,
      courseId: input.courseId,
      stripeCheckoutSessionId: { not: null }
    },
    orderBy: { createdAt: "desc" },
    select: { stripeCheckoutSessionId: true }
  });

  if (!payment?.stripeCheckoutSessionId) return false;

  const session = await getStripe().checkout.sessions.retrieve(payment.stripeCheckoutSessionId, {
    expand: ["payment_intent"]
  });

  return finalizePaidCourseSession(session);
}

export async function ensureEnrollmentForPaidCoursePayment(input: {
  userId: string;
  courseId: string;
}) {
  const payment = await db.payment.findFirst({
    where: {
      purpose: "COURSE",
      status: "PAID",
      userId: input.userId,
      courseId: input.courseId
    },
    select: { id: true }
  });

  if (!payment) return false;

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: input.userId, courseId: input.courseId } },
    update: {},
    create: { userId: input.userId, courseId: input.courseId }
  });

  await sendPurchaseThankYouEmail({
    paymentId: payment.id,
    userId: input.userId,
    courseId: input.courseId
  });

  return true;
}
