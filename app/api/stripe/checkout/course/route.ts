import { NextResponse } from "next/server";
import { CourseStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRequestOrigin, getStripe } from "@/lib/stripe";
import { confirmLatestPaidCourseCheckout, ensureEnrollmentForPaidCoursePayment } from "@/lib/stripe-course-payments";

const checkoutSchema = z.object({
  courseId: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "You must be signed in to buy this course." }, { status: 401 });
  }

  if (session.user.role !== UserRole.STUDENT && session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json({ ok: false, error: "Only student and educator accounts can enroll in courses." }, { status: 403 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid checkout request." }, { status: 400 });
  }

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titlePs: true,
      titleDa: true,
      status: true,
      isPaid: true,
      priceCents: true,
      currency: true,
      enrollments: {
        where: { userId: session.user.id },
        select: { id: true },
        take: 1
      }
    }
  });

  if (!course || course.status !== CourseStatus.PUBLISHED) {
    return NextResponse.json({ ok: false, error: "Course not found or not available." }, { status: 404 });
  }

  if (course.enrollments.length > 0) {
    return NextResponse.json({ ok: true, data: { enrolled: true, url: `/courses/${encodeURIComponent(course.slug || course.id)}` } });
  }

  const paidPaymentExists = await ensureEnrollmentForPaidCoursePayment({
    userId: session.user.id,
    courseId: course.id
  }).catch(() => false);
  if (paidPaymentExists) {
    return NextResponse.json({ ok: true, data: { enrolled: true, url: `/courses/${encodeURIComponent(course.slug || course.id)}` } });
  }

  const alreadyPaid = await confirmLatestPaidCourseCheckout({
    userId: session.user.id,
    courseId: course.id
  }).catch(() => false);
  if (alreadyPaid) {
    return NextResponse.json({ ok: true, data: { enrolled: true, url: `/courses/${encodeURIComponent(course.slug || course.id)}` } });
  }

  if (!course.isPaid) {
    return NextResponse.json({ ok: false, error: "This course is free. Use the normal enroll button." }, { status: 400 });
  }

  const amountCents = course.priceCents ?? 0;
  if (amountCents < 100) {
    return NextResponse.json({ ok: false, error: "This paid course does not have a valid price yet." }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = getRequestOrigin(request);
  const courseRef = course.slug || course.id;
  const title = course.titleEn || course.titleDa || course.titlePs || "KabulLearn course";

  const payment = await db.payment.create({
    data: {
      purpose: "COURSE",
      status: "PENDING",
      amountCents,
      currency: course.currency || "usd",
      userId: session.user.id,
      courseId: course.id,
      donorEmail: session.user.email ?? null,
      donorName: session.user.name ?? null,
      metadata: { courseRef }
    },
    select: { id: true }
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: payment.id,
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (course.currency || "usd").toLowerCase(),
          unit_amount: amountCents,
          product_data: {
            name: title,
            description: "KabulLearn paid course access"
          }
        }
      }
    ],
    metadata: {
      paymentId: payment.id,
      purpose: "COURSE",
      userId: session.user.id,
      courseId: course.id
    },
    payment_intent_data: {
      metadata: {
        paymentId: payment.id,
        purpose: "COURSE",
        userId: session.user.id,
        courseId: course.id
      }
    },
    success_url: `${origin}/courses/${encodeURIComponent(courseRef)}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/courses/${encodeURIComponent(courseRef)}?checkout=cancelled`
  });

  await db.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: checkout.id }
  });

  return NextResponse.json({ ok: true, data: { url: checkout.url } });
}
