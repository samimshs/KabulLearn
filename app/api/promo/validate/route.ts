import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  code: z.string().min(1).max(50),
  courseId: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in to apply a promo code." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const { code, courseId } = parsed.data;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, priceCents: true, currency: true, isPaid: true }
  });

  if (!course?.isPaid || !course.priceCents) {
    return NextResponse.json({ ok: false, error: "This course is not a paid course." }, { status: 400 });
  }

  const promo = await db.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() }
  });

  if (!promo || !promo.isActive) {
    return NextResponse.json({ ok: false, error: "Invalid promo code." }, { status: 404 });
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "This promo code has expired." }, { status: 400 });
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ ok: false, error: "This promo code has reached its usage limit." }, { status: 400 });
  }

  if (promo.courseId && promo.courseId !== courseId) {
    return NextResponse.json({ ok: false, error: "This promo code is not valid for this course." }, { status: 400 });
  }

  const originalCents = course.priceCents;
  let discountCents: number;

  if (promo.discountType === "PERCENT") {
    discountCents = Math.round(originalCents * (promo.discountValue / 100));
  } else {
    discountCents = promo.discountValue;
  }

  const finalCents = Math.max(0, originalCents - discountCents);

  return NextResponse.json({
    ok: true,
    data: {
      promoCodeId: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      originalCents,
      discountCents,
      finalCents,
      currency: course.currency
    }
  });
}
