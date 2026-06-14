import fs from "node:fs";
import { PrismaClient, UserRole } from "@prisma/client";
import Stripe from "stripe";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.local");

const db = new PrismaClient();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3002").replace(/\/$/, "");
}

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatUsdFromCents(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2
  }).format(cents / 100);
}

async function sendEmail({ to, subject, html, marker }) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) return false;

  const existing = await db.notificationLog.findFirst({
    where: { email: to, body: { contains: marker } },
    select: { id: true }
  });
  if (existing) return true;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Email failed for ${to}:`, response.status, body);
    return false;
  }

  await db.notificationLog.create({
    data: {
      email: to,
      subject,
      body: marker,
      status: "SENT",
      sentAt: new Date()
    }
  });

  return true;
}

async function createInboxOnce({ senderId, recipientId, body }) {
  const existing = await db.directMessage.findFirst({
    where: { senderId, recipientId, body },
    select: { id: true }
  });
  if (existing) return false;
  await db.directMessage.create({ data: { senderId, recipientId, body } });
  return true;
}

function creatorEmailHtml({ creatorName, studentName, courseTitleEn, courseTitlePs, courseTitleDa, amountLabel, courseUrl }) {
  const creatorEn = esc(creatorName || "educator");
  const creatorPs = esc(creatorName || "استاد");
  const creatorFa = esc(creatorName || "استاد");
  const studentEn = esc(studentName || "A student");
  const studentPs = esc(studentName || "یوه زده‌کوونکي");
  const studentFa = esc(studentName || "یک شاگرد");
  const titleEn = esc(courseTitleEn);
  const titlePs = esc(courseTitlePs || courseTitleEn);
  const titleFa = esc(courseTitleDa || courseTitleEn);
  const amount = esc(amountLabel);
  const url = esc(courseUrl);
  const btn = "display:inline-block;background:#0057ff;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700";
  return `<div style="font-family:Arial,sans-serif;line-height:1.65;color:#102033;max-width:640px;margin:auto">
    <h1>Congratulations on your course sale</h1>
    <h2>Congratulations, ${creatorEn}.</h2>
    <p>${studentEn} purchased <strong>${titleEn}</strong> for <strong>${amount}</strong>. Your work is reaching learners.</p>
    <p><a href="${url}" style="${btn}">View course</a></p>
    <hr>
    <div dir="rtl" style="text-align:right">
      <h2>مبارک شه، ${creatorPs}.</h2>
      <p>${studentPs} ستاسو <strong>${titlePs}</strong> کورس په <strong>${amount}</strong> وپېره. ستاسو هڅې زده‌کوونکو ته رسېږي.</p>
      <p><a href="${url}" style="${btn}">کورس وګورئ</a></p>
    </div>
    <hr>
    <div dir="rtl" style="text-align:right">
      <h2>تبریک، ${creatorFa}.</h2>
      <p>${studentFa} کورس <strong>${titleFa}</strong> شما را به مبلغ <strong>${amount}</strong> خرید. تلاش شما به شاگردان می‌رسد.</p>
      <p><a href="${url}" style="${btn}">مشاهده کورس</a></p>
    </div>
  </div>`;
}

async function markPaidIfStripeConfirms(payment) {
  if (payment.status === "PAID") return payment;
  if (!stripe || !payment.stripeCheckoutSessionId) return null;

  const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId, {
    expand: ["payment_intent"]
  });
  if (session.payment_status !== "paid" || session.metadata?.purpose !== "COURSE") return null;

  return db.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null
    }
  });
}

async function main() {
  const admin = await db.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });
  if (!admin) throw new Error("No admin user found to send inbox messages.");

  const payments = await db.payment.findMany({
    where: {
      purpose: "COURSE",
      status: { in: ["PAID", "PENDING"] },
      userId: { not: null },
      courseId: { not: null }
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      course: {
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titlePs: true,
          titleDa: true,
          author: { select: { id: true, email: true, name: true } }
        }
      }
    }
  });

  let processed = 0;
  let emails = 0;
  let inbox = 0;

  for (const row of payments) {
    const payment = await markPaidIfStripeConfirms(row);
    if (!payment || !row.user || !row.course || !row.userId || !row.courseId) continue;

    await db.enrollment.upsert({
      where: { userId_courseId: { userId: row.userId, courseId: row.courseId } },
      update: {},
      create: { userId: row.userId, courseId: row.courseId }
    });

    const amountLabel = formatUsdFromCents(row.amountCents);
    const courseUrl = `${appBaseUrl()}/courses/${encodeURIComponent(row.course.slug || row.course.id)}`;

    if (row.course.author.email) {
      const sent = await sendEmail({
        to: row.course.author.email,
        subject: `Congratulations — ${row.course.titleEn} was purchased`,
        marker: `course-sale-congrats:${row.id}`,
        html: creatorEmailHtml({
          creatorName: row.course.author.name,
          studentName: row.user.name,
          courseTitleEn: row.course.titleEn,
          courseTitlePs: row.course.titlePs,
          courseTitleDa: row.course.titleDa,
          amountLabel,
          courseUrl
        })
      });
      if (sent) emails += 1;
    }

    const studentInbox = await createInboxOnce({
      senderId: admin.id,
      recipientId: row.userId,
      body: `Thank you for purchasing "${row.course.titleEn}". Your enrollment is active, and the course is ready whenever you are. Wishing you focus, confidence, and steady progress.`
    });
    if (studentInbox) inbox += 1;

    const creatorInbox = await createInboxOnce({
      senderId: admin.id,
      recipientId: row.course.author.id,
      body: `Congratulations! ${row.user.name ?? "A student"} purchased "${row.course.titleEn}" for ${amountLabel}. Your course is reaching learners, and we are excited to see your work creating value.`
    });
    if (creatorInbox) inbox += 1;

    processed += 1;
  }

  console.log(`Processed ${processed} course purchase payment(s).`);
  console.log(`Creator email send/check operations completed: ${emails}.`);
  console.log(`New inbox messages created: ${inbox}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
