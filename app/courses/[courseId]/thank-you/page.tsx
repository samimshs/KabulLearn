import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { dictionaries } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";
import { confirmPaidCourseCheckout, ensureEnrollmentForPaidCoursePayment } from "@/lib/stripe-course-payments";

export const metadata = {
  title: "Thank you for your course purchase",
  description: "A thank-you message after purchasing a KabulLearn course."
};

function localizedTitle(
  locale: "en" | "ps" | "fa",
  course: { titleEn: string; titlePs: string; titleDa: string | null }
) {
  if (locale === "ps") return course.titlePs || course.titleEn;
  if (locale === "fa") return course.titleDa || course.titleEn;
  return course.titleEn;
}

export default async function CoursePurchaseThankYouPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const locale = await getServerLocale();
  const t = dictionaries[locale];
  const { courseId: rawCourseId } = await params;
  const courseRef = decodeURIComponent(rawCourseId);
  const query = await searchParams;

  const course = await db.course.findFirst({
    where: { OR: [{ id: courseRef }, { slug: courseRef }] },
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      titleEn: true,
      titlePs: true,
      titleDa: true
    }
  });

  if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;
  let paymentConfirmed = false;

  if (userId) {
    paymentConfirmed = await confirmPaidCourseCheckout({
      sessionId: query?.session_id,
      userId,
      courseId: course.id
    }).catch(() => false);

    if (!paymentConfirmed) {
      paymentConfirmed = await ensureEnrollmentForPaidCoursePayment({
        userId,
        courseId: course.id
      }).catch(() => false);
    }
  }

  const courseHref = `/courses/${encodeURIComponent(course.slug || course.id)}`;
  const title = localizedTitle(locale, course);

  return (
    <main className="pr-page py-12 lg:py-20">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-white shadow-[var(--shadow)]">
        <div className="bg-[linear-gradient(135deg,rgba(0,87,255,0.10),rgba(24,130,92,0.10))] px-6 py-10 text-center sm:px-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--success)] shadow-[var(--shadow-sm)]" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="pr-eyebrow mt-6">
            {paymentConfirmed ? t.coursePurchaseThankYouEyebrow : t.coursePurchasePendingEyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(28px,4vw,44px)] font-[900] leading-tight tracking-[-0.8px] text-[var(--ink)]">
            {paymentConfirmed ? t.coursePurchaseThankYouTitle : t.coursePurchasePendingTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] font-[600] leading-8 text-[var(--ink-2)]">
            {paymentConfirmed ? t.coursePurchaseThankYouIntro : t.coursePurchasePendingBody}
          </p>
        </div>

        <div className="grid gap-6 px-6 py-8 sm:px-10">
          <div className="rounded-[var(--radius-lg)] border border-[rgba(0,87,255,0.12)] bg-[var(--brand-50)] p-5">
            <p className="text-[12px] font-[900] uppercase tracking-[1.2px] text-[var(--brand)]">
              {t.coursePurchaseThankYouCourseLabel}
            </p>
            <h2 className="mt-2 text-[20px] font-[900] text-[var(--ink)]">{title}</h2>
          </div>

          {!paymentConfirmed ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgba(150,96,0,0.2)] bg-[var(--warning-50)] p-5">
              <p className="text-[14px] font-[700] leading-7 text-[var(--warning)]">{t.coursePurchasePendingHint}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={courseHref} className="pr-btn-primary justify-center">
              {paymentConfirmed ? t.coursePurchaseThankYouCta : t.backToCourse}
            </Link>
            <Link href="/courses" className="pr-btn-ghost justify-center">
              {t.backToCourses}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
