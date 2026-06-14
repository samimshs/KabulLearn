import type Stripe from "stripe";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { appBaseUrl, sendCourseCreatorSaleEmail, sendCoursePurchaseThankYouEmail } from "@/lib/email-verification";
import { formatUsdFromCents, getStripe } from "@/lib/stripe";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function createInboxMessageOnce(input: {
  senderId: string;
  recipientId: string;
  body: string;
}) {
  const existing = await db.directMessage.findFirst({
    where: {
      senderId: input.senderId,
      recipientId: input.recipientId,
      body: input.body
    },
    select: { id: true }
  });

  if (existing) return;

  await db.directMessage.create({
    data: {
      senderId: input.senderId,
      recipientId: input.recipientId,
      body: input.body
    }
  });
}

export async function sendCoursePurchaseNotifications(input: {
  paymentId: string;
  userId: string;
  courseId: string;
}) {
  const [admin, user, course, payment] = await Promise.all([
    db.user.findFirst({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    }),
    db.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true }
    }),
    db.course.findUnique({
      where: { id: input.courseId },
      select: {
        slug: true,
        titleEn: true,
        titlePs: true,
        titleDa: true,
        author: { select: { id: true, email: true, name: true } }
      }
    }),
    db.payment.findUnique({
      where: { id: input.paymentId },
      select: { amountCents: true, currency: true }
    })
  ]);

  if (!user || !course || !admin) return;

  const amountLabel = formatUsdFromCents(payment?.amountCents ?? 0);
  const courseUrl = `${appBaseUrl()}/courses/${encodeURIComponent(course.slug || input.courseId)}`;

  // Existing student purchase receipt/thank-you email. Idempotent by payment id.
  if (user.email) {
    await sendCoursePurchaseThankYouEmail({
      email: user.email,
      name: user.name,
      courseTitleEn: course.titleEn,
      courseTitlePs: course.titlePs,
      courseTitleDa: course.titleDa,
      courseUrl,
      paymentId: input.paymentId
    }).catch((error) => {
      console.error("Course purchase thank-you email failed:", error);
    });
  }

  // New creator sale notification email. Idempotent by payment id.
  if (course.author.email) {
    await sendCourseCreatorSaleEmail({
      email: course.author.email,
      creatorName: course.author.name,
      studentName: user.name,
      courseTitleEn: course.titleEn,
      courseTitlePs: course.titlePs,
      courseTitleDa: course.titleDa,
      amountLabel,
      courseUrl,
      paymentId: input.paymentId
    }).catch((error) => {
      console.error("Course creator sale email failed:", error);
    });
  }

  await createInboxMessageOnce({
    senderId: admin.id,
    recipientId: input.userId,
    body: `Thank you for purchasing "${course.titleEn}". Your enrollment is active, and the course is ready whenever you are. Wishing you focus, confidence, and steady progress.`
  });

  await createInboxMessageOnce({
    senderId: admin.id,
    recipientId: course.author.id,
    body: `Congratulations! ${user.name ?? "A student"} purchased "${course.titleEn}" for ${amountLabel}. Your course is reaching learners, and we are excited to see your work creating value.`
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

  await sendCoursePurchaseNotifications({ paymentId: payment.id, userId, courseId });

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

  await sendCoursePurchaseNotifications({
    paymentId: payment.id,
    userId: input.userId,
    courseId: input.courseId
  });

  return true;
}
