import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset:";

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "throwaway.email",
  "yopmail.com"
]);

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3002"
  ).replace(/\/$/, "");
}

export function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && DISPOSABLE_EMAIL_DOMAINS.has(domain));
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetIdentifier(email: string) {
  return `${PASSWORD_RESET_IDENTIFIER_PREFIX}${email.toLowerCase()}`;
}

export function emailFromPasswordResetIdentifier(identifier: string) {
  if (!identifier.startsWith(PASSWORD_RESET_IDENTIFIER_PREFIX)) return null;
  return identifier.slice(PASSWORD_RESET_IDENTIFIER_PREFIX.length);
}

export async function createVerificationToken(email: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashVerificationToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await db.verificationToken.deleteMany({
    where: { identifier: email }
  });

  await db.verificationToken.create({
    data: {
      identifier: email,
      token: tokenHash,
      expires
    }
  });

  return {
    rawToken,
    expires,
    verifyUrl: `${appBaseUrl()}/verify?token=${encodeURIComponent(rawToken)}`
  };
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.toLowerCase();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashVerificationToken(rawToken);
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const identifier = passwordResetIdentifier(normalizedEmail);

  await db.verificationToken.deleteMany({
    where: { identifier }
  });

  await db.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires
    }
  });

  return {
    rawToken,
    expires,
    resetUrl: `${appBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`
  };
}

// ─── Email HTML builders ──────────────────────────────────────────────────────

const BTN = `display:inline-block;background:#0057ff;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700`;
const DIVIDER = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />`;
const EN_LABEL = `<p style="font-size:11px;color:#526174;margin:0 0 12px">English ↓</p>`;

function verificationHtml(verifyUrl: string, name: string | null, locale: string): string {
  const safeNameEn = esc(name ?? "learner");
  const safeNamePs = esc(name ?? "زده‌کوونکی");
  const safeNameFa = esc(name ?? "شاگرد");

  const enBlock = `
    <h1 style="margin:0 0 12px">Verify your KabulLearn account</h1>
    <p>Hello ${safeNameEn},</p>
    <p>Click the link below to activate your account. This link expires in 15 minutes.</p>
    <p><a href="${verifyUrl}" style="${BTN}">Verify account</a></p>
    <p>If the button does not work, open this URL:</p>
    <p style="word-break:break-all">${verifyUrl}</p>`;

  if (locale === "ps") {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">
      <div dir="rtl" style="text-align:right">
        <h1 style="margin:0 0 12px">د کابل‌لرن حساب تایید کړئ</h1>
        <p>سلام ${safeNamePs},</p>
        <p>د خپل حساب د فعالولو لپاره لاندې تڼۍ کېکاږئ. دا لینک په ۱۵ دقیقو کې پای ته رسېږي.</p>
        <p><a href="${verifyUrl}" style="${BTN}">حساب تایید کړئ</a></p>
        <p>که تڼۍ کار نه کوي، دا URL پرانیزئ:</p>
        <p style="word-break:break-all">${verifyUrl}</p>
      </div>
      ${DIVIDER}${EN_LABEL}${enBlock}
    </div>`;
  }

  if (locale === "fa") {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">
      <div dir="rtl" style="text-align:right">
        <h1 style="margin:0 0 12px">تأیید حساب کابل‌لرن شما</h1>
        <p>سلام ${safeNameFa},</p>
        <p>برای فعال‌سازی حساب خود روی دکمه زیر کلیک کنید. این لینک در ۱۵ دقیقه منقضی می‌شود.</p>
        <p><a href="${verifyUrl}" style="${BTN}">تأیید حساب</a></p>
        <p>اگر دکمه کار نمی‌کند، این URL را باز کنید:</p>
        <p style="word-break:break-all">${verifyUrl}</p>
      </div>
      ${DIVIDER}${EN_LABEL}${enBlock}
    </div>`;
  }

  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">${enBlock}</div>`;
}

function passwordResetHtml(resetUrl: string, name: string | null, locale: string): string {
  const safeNameEn = esc(name ?? "learner");
  const safeNamePs = esc(name ?? "زده‌کوونکی");
  const safeNameFa = esc(name ?? "شاگرد");

  const enBlock = `
    <h1 style="margin:0 0 12px">Reset your KabulLearn password</h1>
    <p>Hello ${safeNameEn},</p>
    <p>Click the link below to choose a new password. This link expires in 30 minutes.</p>
    <p><a href="${resetUrl}" style="${BTN}">Reset password</a></p>
    <p>If you did not request this change, you can ignore this email.</p>
    <p>If the button does not work, open this URL:</p>
    <p style="word-break:break-all">${resetUrl}</p>`;

  if (locale === "ps") {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">
      <div dir="rtl" style="text-align:right">
        <h1 style="margin:0 0 12px">د کابل‌لرن پټنوم بدل کړئ</h1>
        <p>سلام ${safeNamePs},</p>
        <p>د نوي پټنوم د ټاکلو لپاره لاندې تڼۍ کېکاږئ. دا لینک په ۳۰ دقیقو کې پای ته رسېږي.</p>
        <p><a href="${resetUrl}" style="${BTN}">پټنوم بدل کړئ</a></p>
        <p>که تاسو دا بدلون نه وي غوښتی، دا برېښنالیک له پامه وباسئ.</p>
        <p>که تڼۍ کار نه کوي، دا URL پرانیزئ:</p>
        <p style="word-break:break-all">${resetUrl}</p>
      </div>
      ${DIVIDER}${EN_LABEL}${enBlock}
    </div>`;
  }

  if (locale === "fa") {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">
      <div dir="rtl" style="text-align:right">
        <h1 style="margin:0 0 12px">بازنشانی رمز عبور کابل‌لرن شما</h1>
        <p>سلام ${safeNameFa},</p>
        <p>برای انتخاب رمز عبور جدید روی دکمه زیر کلیک کنید. این لینک در ۳۰ دقیقه منقضی می‌شود.</p>
        <p><a href="${resetUrl}" style="${BTN}">بازنشانی رمز عبور</a></p>
        <p>اگر این تغییر را درخواست نکردید، این ایمیل را نادیده بگیرید.</p>
        <p>اگر دکمه کار نمی‌کند، این URL را باز کنید:</p>
        <p style="word-break:break-all">${resetUrl}</p>
      </div>
      ${DIVIDER}${EN_LABEL}${enBlock}
    </div>`;
  }

  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">${enBlock}</div>`;
}

// Educator welcome is always trilingual — it's sent by an admin on the user's behalf,
// so we can't reliably know which language the recipient prefers at that moment.
function educatorWelcomeHtml(name: string): string {
  const safeName = esc(name);
  return `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#102033;max-width:600px">

    <!-- Pashto -->
    <div dir="rtl" style="text-align:right">
      <h1 style="margin:0 0 8px;color:#0057FF">مبارک شه، ${safeName}!</h1>
      <p style="margin:0 0 20px;font-size:16px">ستاسو غوښتنه تایید شوه — تاسو اوس په کابل‌لرن کې استاد یاست.</p>
      <h2 style="font-size:14px;font-weight:800;color:#526174;margin:0 0 8px">د ننوتلو لارښوونه</h2>
      <p>ستاسو حساب هماغه دی چې د زده‌کوونکي په توګه مو کاراوه — هماغه برېښنالیک، هماغه پټنوم. په <a href="https://kabullearn.com/login" style="color:#0057FF">kabullearn.com</a> کې ننوځئ.</p>
      <p style="margin-top:20px"><a href="https://kabullearn.com/login" style="${BTN}">د استاد ډشبورډ ته لاړ شئ</a></p>
      <h2 style="font-size:14px;font-weight:800;color:#526174;margin:28px 0 8px">د استاد سرچینې</h2>
      <ul style="padding-right:20px;padding-left:0;margin:0 0 16px">
        <li><a href="https://kabullearn.com/educator-guidelines" style="color:#0057FF">د استاد لارښوونې</a> — د کورس جوړښت، د ثبت لارښوونې، د ازموینې اړتیاوې</li>
        <li><a href="https://kabullearn.com/educator-resources" style="color:#0057FF">د تدریس سرچینې</a> — د لومړي کورس لپاره وسایل</li>
      </ul>
      <h2 style="font-size:14px;font-weight:800;color:#526174;margin:28px 0 8px">د زده‌کوونکي تاریخچه</h2>
      <p>ستاسو مخکینی کورس پرمختګ او سندونه ساتل شوي دي. د اړتیا پر مهال <a href="mailto:info@kabulhub.com" style="color:#0057FF">info@kabulhub.com</a> له لارې موږ سره اړیکه ونیسئ.</p>
      <p style="margin-top:28px;color:#526174;font-size:13px">موږ خوښ یو چې تاسو د کابل‌لرن له ټیم سره یاست!<br>— د کابل‌لرن ټیم</p>
    </div>

    ${DIVIDER}

    <!-- Dari -->
    <div dir="rtl" style="text-align:right">
      <h1 style="margin:0 0 8px;color:#0057FF">تبریک، ${safeName}!</h1>
      <p style="margin:0 0 20px;font-size:16px">درخواست شما تأیید شد — شما اکنون استاد کابل‌لرن هستید.</p>
      <h2 style="font-size:14px;font-weight:800;color:#526174;margin:0 0 8px">راهنمای ورود</h2>
      <p>حساب شما همان است که به عنوان شاگرد داشتید — همان ایمیل، همان رمز عبور. در <a href="https://kabullearn.com/login" style="color:#0057FF">kabullearn.com</a> وارد شوید.</p>
      <p style="margin-top:20px"><a href="https://kabullearn.com/login" style="${BTN}">رفتن به داشبورد استاد</a></p>
      <h2 style="font-size:14px;font-weight:800;color:#526174;margin:28px 0 8px">منابع استادی</h2>
      <ul style="padding-right:20px;padding-left:0;margin:0 0 16px">
        <li><a href="https://kabullearn.com/educator-guidelines" style="color:#0057FF">رهنمودهای استاد</a> — ساختار کورس، نکات ضبط، نیازمندی‌های آزمون</li>
        <li><a href="https://kabullearn.com/educator-resources" style="color:#0057FF">منابع تدریس</a> — ابزارها و چک‌لیست‌ها برای اولین کورس</li>
      </ul>
      <h2 style="font-size:14px;font-weight:800;color:#526174;margin:28px 0 8px">درباره تاریخچه شاگردی</h2>
      <p>پیشرفت کورس و گواهی‌های قبلی شما محفوظ است. در صورت نیاز با <a href="mailto:info@kabulhub.com" style="color:#0057FF">info@kabulhub.com</a> تماس بگیرید.</p>
      <p style="margin-top:28px;color:#526174;font-size:13px">به تیم خوش آمدید — خوشحالیم که در کابل‌لرن تدریس می‌کنید!<br>— تیم کابل‌لرن</p>
    </div>

    ${DIVIDER}

    <!-- English -->
    <div dir="ltr">
      <h1 style="margin:0 0 8px;color:#0057FF">Congratulations, ${safeName}!</h1>
      <p style="margin:0 0 20px;font-size:16px">Your application has been approved — you are now an educator on KabulLearn.</p>
      <h2 style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#526174;margin:0 0 8px">How to log in as an educator</h2>
      <p>Your account is the <strong>same account</strong> you used as a student — same email, same password. Sign in at <a href="https://kabullearn.com/login" style="color:#0057FF">kabullearn.com</a> and you will be taken directly to your <strong>Educator Dashboard</strong>.</p>
      <p style="margin-top:20px"><a href="https://kabullearn.com/login" style="${BTN}">Go to Educator Dashboard</a></p>
      <h2 style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#526174;margin:28px 0 8px">Educator resources</h2>
      <ul style="padding-left:20px;margin:0 0 16px">
        <li><a href="https://kabullearn.com/educator-guidelines" style="color:#0057FF">Educator Guidelines</a> — course structure, recording tips, quiz requirements</li>
        <li><a href="https://kabullearn.com/educator-resources" style="color:#0057FF">Teaching Resources</a> — tools and checklists for your first course</li>
      </ul>
      <h2 style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#526174;margin:28px 0 8px">About your student history</h2>
      <p>Your previous course progress and certificates are preserved. Contact us at <a href="mailto:info@kabulhub.com" style="color:#0057FF">info@kabulhub.com</a> if you need access.</p>
      <p style="margin-top:28px;color:#526174;font-size:13px">Welcome to the team — we are excited to have you teach on KabulLearn!<br>The KabulLearn Team</p>
    </div>

  </div>`;
}

function educatorRejectionHtml(name: string, reason: string): string {
  const safeName = esc(name);
  const safeReason = reason.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#102033;max-width:600px">

    <!-- Pashto -->
    <div dir="rtl" style="text-align:right">
      <h1 style="margin:0 0 8px;color:#102033">د کابل‌لرن د استاد غوښتنه</h1>
      <p>سلام ${safeName},</p>
      <p>مننه چې د کابل‌لرن استاد کېدو لپاره مو غوښتنه وکړه. له بده مرغه، ستاسو غوښتنه دا مهال نه شي منل کېدای.</p>
      <div style="background:#f8f9fb;border-left:3px solid #0057ff;padding:12px 16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;font-weight:700">د رد کېدو دلیل:</p>
        <p style="margin:8px 0 0;white-space:pre-wrap">${safeReason}</p>
      </div>
      <p>که فکر کوئ چې دا تېروتنه ده، یا غواړئ بیا غوښتنه وکړئ، مهرباني وکړئ له <a href="mailto:info@kabulhub.com" style="color:#0057FF">info@kabulhub.com</a> سره اړیکه ونیسئ.</p>
      <p style="color:#526174;font-size:13px">— د کابل‌لرن ټیم</p>
    </div>

    ${DIVIDER}

    <!-- Dari -->
    <div dir="rtl" style="text-align:right">
      <h1 style="margin:0 0 8px;color:#102033">درخواست استادی کابل‌لرن</h1>
      <p>سلام ${safeName},</p>
      <p>از این‌که برای تدریس در کابل‌لرن درخواست دادید سپاسگزاریم. متأسفانه درخواست شما در این مرحله پذیرفته نشد.</p>
      <div style="background:#f8f9fb;border-left:3px solid #0057ff;padding:12px 16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;font-weight:700">دلیل رد درخواست:</p>
        <p style="margin:8px 0 0;white-space:pre-wrap">${safeReason}</p>
      </div>
      <p>اگر فکر می‌کنید این اشتباه است یا می‌خواهید دوباره درخواست دهید، با <a href="mailto:info@kabulhub.com" style="color:#0057FF">info@kabulhub.com</a> تماس بگیرید.</p>
      <p style="color:#526174;font-size:13px">— تیم کابل‌لرن</p>
    </div>

    ${DIVIDER}

    <!-- English -->
    <div dir="ltr">
      <h1 style="margin:0 0 8px;color:#102033">Your KabulLearn Educator Application</h1>
      <p>Hello ${safeName},</p>
      <p>Thank you for applying to teach on KabulLearn. Unfortunately, your application could not be approved at this time.</p>
      <div style="background:#f8f9fb;border-left:3px solid #0057ff;padding:12px 16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;font-weight:700">Reason:</p>
        <p style="margin:8px 0 0;white-space:pre-wrap">${safeReason}</p>
      </div>
      <p>If you believe this is a mistake or would like to reapply, please contact us at <a href="mailto:info@kabulhub.com" style="color:#0057FF">info@kabulhub.com</a>.</p>
      <p style="color:#526174;font-size:13px">The KabulLearn Team</p>
    </div>

  </div>`;
}

// ─── Subject lines ────────────────────────────────────────────────────────────

const EMAIL_SUBJECTS: Record<string, Record<string, string>> = {
  verification: {
    en: "Verify your KabulLearn account",
    ps: "د کابل‌لرن حساب تایید کړئ",
    fa: "تأیید حساب کابل‌لرن شما"
  },
  passwordReset: {
    en: "Reset your KabulLearn password",
    ps: "د کابل‌لرن پټنوم بدل کړئ",
    fa: "بازنشانی رمز عبور کابل‌لرن"
  },
  educatorWelcome: {
    en: "Welcome to the KabulLearn Educator Program!",
    ps: "د کابل‌لرن د استاد پروګرام ته ښه راغلاست!",
    fa: "به برنامه استادی کابل‌لرن خوش آمدید!"
  },
  certificate: {
    en: "🎓 You earned your certificate on KabulLearn",
    ps: "🎓 تاسو د کابل‌لرن سند ترلاسه کړ",
    fa: "🎓 شما گواهی کابل‌لرن خود را دریافت کردید"
  }
};

function subjectFor(type: keyof typeof EMAIL_SUBJECTS, locale: string): string {
  return EMAIL_SUBJECTS[type][locale] ?? EMAIL_SUBJECTS[type]["en"];
}

// ─── Public senders ───────────────────────────────────────────────────────────

export async function sendVerificationEmail(input: {
  email: string;
  name?: string | null;
  verifyUrl: string;
  locale?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Verification email not sent: RESEND_API_KEY or FROM_EMAIL is missing.");
    return { sent: false };
  }

  const locale = input.locale ?? "en";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.email,
      subject: subjectFor("verification", locale),
      html: verificationHtml(input.verifyUrl, input.name ?? null, locale)
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Verification email failed:", response.status, body);
    return { sent: false };
  }

  return { sent: true };
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name?: string | null;
  resetUrl: string;
  locale?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Password reset email not sent: RESEND_API_KEY or FROM_EMAIL is missing.");
    return { sent: false };
  }

  const locale = input.locale ?? "en";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.email,
      subject: subjectFor("passwordReset", locale),
      html: passwordResetHtml(input.resetUrl, input.name ?? null, locale)
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Password reset email failed:", response.status, body);
    return { sent: false };
  }

  return { sent: true };
}

export async function sendEducatorRejectionEmail(input: {
  email: string;
  name?: string | null;
  reason: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Educator rejection email not sent: RESEND_API_KEY or FROM_EMAIL is missing.");
    return { sent: false };
  }

  const name = input.name || "applicant";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.email,
      subject: "د کابل‌لرن د استاد غوښتنه / درخواست استادی کابل‌لرن / Your KabulLearn Educator Application",
      html: educatorRejectionHtml(name, input.reason)
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Educator rejection email failed:", response.status, body);
    return { sent: false };
  }

  return { sent: true };
}

export async function sendEducatorWelcomeEmail(input: {
  email: string;
  name?: string | null;
  locale?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Educator welcome email not sent: RESEND_API_KEY or FROM_EMAIL is missing.");
    return { sent: false };
  }

  const name = input.name || "educator";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.email,
      subject: "د کابل‌لرن د استاد پروګرام ته ښه راغلاست! / به برنامه استادی کابل‌لرن خوش آمدید! / Welcome to the KabulLearn Educator Program!",
      html: educatorWelcomeHtml(name)
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Educator welcome email failed:", response.status, body);
    return { sent: false };
  }

  return { sent: true };
}

export async function sendCoursePurchaseThankYouEmail(input: {
  email: string;
  name?: string | null;
  courseTitleEn: string;
  courseTitlePs?: string | null;
  courseTitleDa?: string | null;
  courseUrl: string;
  paymentId: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Course purchase email not sent: RESEND_API_KEY or FROM_EMAIL is missing.");
    return { sent: false };
  }

  const marker = `course-purchase-thank-you:${input.paymentId}`;
  const existing = await db.notificationLog.findFirst({
    where: {
      email: input.email,
      body: { contains: marker }
    },
    select: { id: true }
  });
  if (existing) return { sent: true };

  const subject = `Your KabulLearn course is ready — ${input.courseTitleEn}`;
  const html = coursePurchaseThankYouHtml(input);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.email,
      subject,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Course purchase email failed:", response.status, body);
    return { sent: false };
  }

  await db.notificationLog.create({
    data: {
      email: input.email,
      subject,
      body: `${marker}\n${input.courseTitleEn}`,
      status: "SENT",
      sentAt: new Date()
    }
  });

  return { sent: true };
}

// ─── Support ticket confirmation ───────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function coursePurchaseThankYouHtml(input: {
  name?: string | null;
  courseTitleEn: string;
  courseTitlePs?: string | null;
  courseTitleDa?: string | null;
  courseUrl: string;
}): string {
  const nameEn = esc(input.name || "learner");
  const namePs = esc(input.name || "زده‌کوونکی");
  const nameFa = esc(input.name || "شاگرد");
  const titleEn = esc(input.courseTitleEn);
  const titlePs = esc(input.courseTitlePs || input.courseTitleEn);
  const titleFa = esc(input.courseTitleDa || input.courseTitleEn);
  const courseUrl = esc(input.courseUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F7FB;color:#102033;">
  <div style="max-width:640px;margin:32px auto;background:#ffffff;border-radius:18px;border:1px solid #E4E3F2;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0057ff,#18825c);padding:30px 32px;color:#ffffff;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase">KabulLearn</p>
      <h1 style="margin:0;font-size:28px;line-height:1.2">Your course is ready</h1>
    </div>
    <div style="padding:28px 32px;line-height:1.65">
      <section>
        <p style="font-size:11px;color:#526174;margin:0 0 12px">English</p>
        <h2 style="margin:0 0 10px;font-size:20px">Thank you for your purchase.</h2>
        <p>Hello ${nameEn},</p>
        <p>Your enrollment in <strong>${titleEn}</strong> is now active, and your course is ready whenever you are. We are grateful that you chose KabulLearn for your learning journey. Wishing you focus, confidence, and steady progress as you begin.</p>
        <p><a href="${courseUrl}" style="${BTN}">Start learning</a></p>
      </section>
      ${DIVIDER}
      <section dir="rtl" style="text-align:right">
        <p style="font-size:11px;color:#526174;margin:0 0 12px">پښتو</p>
        <h2 style="margin:0 0 10px;font-size:20px">ستاسو له پېرودنې مننه.</h2>
        <p>سلام ${namePs}،</p>
        <p>په <strong>${titlePs}</strong> کې ستاسو نوم‌لیکنه اوس فعاله ده، او کورس مو هر وخت چمتو دی. موږ منندوی یو چې د خپلې زده‌کړې د سفر لپاره مو کابل‌لرن غوره کړ. هیله ده د پیل پر مهال تمرکز، باور، او دوامداره پرمختګ ولرئ.</p>
        <p><a href="${courseUrl}" style="${BTN}">زده کړه پیل کړئ</a></p>
      </section>
      ${DIVIDER}
      <section dir="rtl" style="text-align:right">
        <p style="font-size:11px;color:#526174;margin:0 0 12px">دری</p>
        <h2 style="margin:0 0 10px;font-size:20px">از خرید شما سپاسگزاریم.</h2>
        <p>سلام ${nameFa}،</p>
        <p>ثبت‌نام شما در <strong>${titleFa}</strong> اکنون فعال است و کورس هر زمانی که آماده باشید در دسترس شماست. خوشحالیم که کابل‌لرن را برای مسیر آموزشی خود انتخاب کردید. برایتان در آغاز این مسیر تمرکز، اعتمادبه‌نفس و پیشرفت پیوسته آرزو داریم.</p>
        <p><a href="${courseUrl}" style="${BTN}">شروع یادگیری</a></p>
      </section>
      <p style="margin-top:26px;color:#526174;font-size:13px">KabulLearn</p>
    </div>
  </div>
</body>
</html>`;
}

function ticketConfirmationHtml(input: {
  name: string;
  ticketNumber: string;
  issueType: string;
  subject: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F7FB;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;border:1px solid #E4E3F2;overflow:hidden;">
    <div style="background:#0057FF;padding:28px 32px;">
      <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.7);">KabulLearn Support</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#ffffff;">Ticket Received</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0;font-size:15px;color:#2D2B42;">Hi ${esc(input.name)},</p>
      <p style="margin:14px 0 0;font-size:14px;color:#6B6987;line-height:1.75;">
        We received your support request and will get back to you within <strong style="color:#0A0914;">1–2 business days</strong>.
      </p>
      <div style="margin:24px 0;border-radius:12px;border:1px solid #E4E3F2;background:#F7F7FB;padding:20px;text-align:center;">
        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#9896B8;">Your ticket number</p>
        <p style="margin:8px 0 0;font-size:30px;font-weight:900;letter-spacing:3px;color:#0057FF;">${esc(input.ticketNumber)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E4E3F2;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9896B8;width:110px;vertical-align:top;">Issue type</td>
          <td style="padding:10px 0;border-bottom:1px solid #E4E3F2;font-size:13px;font-weight:700;color:#2D2B42;">${esc(input.issueType)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9896B8;vertical-align:top;">Subject</td>
          <td style="padding:10px 0;font-size:13px;font-weight:700;color:#2D2B42;">${esc(input.subject)}</td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#6B6987;line-height:1.75;">
        Save your ticket number — you may need it if you follow up. To add more details, reply to this email with your ticket number in the subject line.
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#6B6987;line-height:1.75;">
        — KabulLearn Support Team<br>
        <a href="mailto:info@kabulhub.com" style="color:#0057FF;text-decoration:none;">info@kabulhub.com</a>
      </p>
    </div>
    <div style="border-top:1px solid #E4E3F2;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9896B8;">KabulLearn is operated by KabulHub LLC &middot; Chicago, Illinois, USA</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Certificate completion ───────────────────────────────────────────────────

function certificateHtml(input: {
  nameEn: string;
  namePs: string;
  nameFa: string;
  courseTitleEn: string;
  courseTitlePs: string;
  courseTitleFa: string;
  grade: number;
  certUrl: string;
  verifyUrl: string;
  linkedinUrl: string;
}): string {
  const { nameEn, namePs, nameFa, courseTitleEn, courseTitlePs, courseTitleFa, grade, certUrl, verifyUrl, linkedinUrl } = input;

  const BTN_GOLD = `display:inline-block;background:#C99A2E;color:#fff;padding:13px 24px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.2px`;
  const BTN_OUTLINE = `display:inline-block;border:1.5px solid #CBD5E1;color:#526174;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px`;
  const LINKEDIN_BTN = `display:inline-block;background:#0077B5;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px`;

  const gradeBadge = (label: string, gradeLabel: string) => `
    <div style="display:inline-block;background:#FFF8E7;border:1.5px solid #E9C840;border-radius:10px;padding:10px 18px;margin:0 0 20px">
      <span style="font-size:12px;font-weight:700;color:#9A7000;display:block;margin-bottom:2px">${label}</span>
      <span style="font-size:26px;font-weight:900;color:#B58C00;font-variant-numeric:tabular-nums">${gradeLabel}</span>
    </div>`;

  const SECTION_DIVIDER = `<hr style="border:none;border-top:1px solid #E4E3F2;margin:28px 0" />`;

  return `<!DOCTYPE html>
<html lang="mul">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;padding:0 12px;">
<div style="background:#fff;border-radius:20px;border:1px solid #E4E3F2;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0057FF 0%,#0E7490 100%);padding:36px 32px;text-align:center;">
    <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-block;line-height:72px;margin-bottom:14px;border:3px solid rgba(255,255,255,0.25);">
      <span style="font-size:34px;line-height:72px;">🎓</span>
    </div>
    <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.65);">KabulLearn</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.3px;">Certificate of Completion</h1>
  </div>

  <div style="padding:0 32px 32px;">

    <!-- ── Pashto ── -->
    <div dir="rtl" style="text-align:right;padding-top:28px;">
      <h2 style="margin:0 0 8px;font-size:21px;font-weight:800;color:#0057FF;">مبارک شه، ${namePs}!</h2>
      <p style="margin:0 0 18px;font-size:15px;color:#334155;line-height:1.7;">
        تاسو د <strong style="color:#0A0914;">"${courseTitlePs}"</strong> کورس بشپړ کړ.
        کابل‌لرن تاسو ته د دې لاسته راوړنې مبارکي وایي.
      </p>
      ${grade > 0 ? gradeBadge("نمره", `${grade}%`) : ""}
      <div style="margin:0 0 14px;">
        <a href="${certUrl}" style="${BTN_GOLD}">د سند ډاونلوډ کړئ ↓</a>
      </div>
      <div style="margin:0 0 18px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${verifyUrl}" style="${BTN_OUTLINE}">آنلاین یې تصدیق کړئ</a>
        <a href="${linkedinUrl}" style="${LINKEDIN_BTN}">په LinkedIn کې یې شریک کړئ</a>
      </div>
      <p style="margin:0;font-size:12px;color:#94A3B8;">د تصدیق کوډ: <strong style="font-family:monospace;color:#526174;letter-spacing:1px;">${verifyUrl.split("code=")[1] ?? ""}</strong></p>
    </div>

    ${SECTION_DIVIDER}

    <!-- ── Dari ── -->
    <div dir="rtl" style="text-align:right;">
      <h2 style="margin:0 0 8px;font-size:21px;font-weight:800;color:#0057FF;">تبریک، ${nameFa}!</h2>
      <p style="margin:0 0 18px;font-size:15px;color:#334155;line-height:1.7;">
        شما کورس <strong style="color:#0A0914;">"${courseTitleFa}"</strong> را با موفقیت به پایان رساندید.
        کابل‌لرن این دستاورد را به شما تبریک می‌گوید.
      </p>
      ${grade > 0 ? gradeBadge("نمره", `${grade}%`) : ""}
      <div style="margin:0 0 14px;">
        <a href="${certUrl}" style="${BTN_GOLD}">دانلود گواهی ↓</a>
      </div>
      <div style="margin:0 0 18px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${verifyUrl}" style="${BTN_OUTLINE}">تأیید آنلاین</a>
        <a href="${linkedinUrl}" style="${LINKEDIN_BTN}">اشتراک در LinkedIn</a>
      </div>
      <p style="margin:0;font-size:12px;color:#94A3B8;">کد تأیید: <strong style="font-family:monospace;color:#526174;letter-spacing:1px;">${verifyUrl.split("code=")[1] ?? ""}</strong></p>
    </div>

    ${SECTION_DIVIDER}

    <!-- ── English ── -->
    <div dir="ltr">
      <h2 style="margin:0 0 8px;font-size:21px;font-weight:800;color:#0057FF;">Congratulations, ${nameEn}!</h2>
      <p style="margin:0 0 18px;font-size:15px;color:#334155;line-height:1.7;">
        You have completed <strong style="color:#0A0914;">"${courseTitleEn}"</strong>.
        This certificate confirms your achievement and can be shared or verified at any time.
      </p>
      ${grade > 0 ? gradeBadge("Your score", `${grade}%`) : ""}
      <div style="margin:0 0 14px;">
        <a href="${certUrl}" style="${BTN_GOLD}">Download Certificate ↓</a>
      </div>
      <div style="margin:0 0 18px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${verifyUrl}" style="${BTN_OUTLINE}">Verify online</a>
        <a href="${linkedinUrl}" style="${LINKEDIN_BTN}">Share on LinkedIn</a>
      </div>
      <p style="margin:0;font-size:12px;color:#94A3B8;">Verification code: <strong style="font-family:monospace;color:#526174;letter-spacing:1px;">${verifyUrl.split("code=")[1] ?? ""}</strong></p>
    </div>

    <!-- Footer -->
    ${SECTION_DIVIDER}
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.7;">
      <a href="https://kabullearn.com" style="color:#94A3B8;text-decoration:none;font-weight:700;">kabullearn.com</a>
      &nbsp;·&nbsp;
      <a href="https://kabullearn.com/dashboard/settings" style="color:#94A3B8;">Unsubscribe</a>
    </p>

  </div>
</div>
</div>
</body>
</html>`;
}

export async function sendCertificateEmail(input: {
  userId: string;
  courseId: string;
  verificationCode: string;
  grade: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) return;

  const [user, course] = await Promise.all([
    db.user.findUnique({
      where: { id: input.userId },
      select: { name: true, email: true },
    }),
    db.course.findUnique({
      where: { id: input.courseId },
      select: { slug: true, titleEn: true, titlePs: true, titleDa: true },
    }),
  ]);
  if (!user || !course) return;

  const firstName = (s: string) => esc(s.split(" ")[0] || s);
  const nameEn = firstName(user.name ?? "Learner");
  const namePs = firstName(user.name ?? "زده کوونکی");
  const nameFa = firstName(user.name ?? "شاگرد");

  const courseTitleEn = esc(course.titleEn || course.titlePs || course.titleDa || "your course");
  const courseTitlePs = esc(course.titlePs || course.titleEn || course.titleDa || "کورس");
  const courseTitleFa = esc(course.titleDa || course.titleEn || course.titlePs || "کورس");

  const certUrl = `https://kabullearn.com/courses/${encodeURIComponent(course.slug)}/certificate`;
  const verifyUrl = `https://kabullearn.com/verify?code=${encodeURIComponent(input.verificationCode)}`;
  const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(certUrl)}&title=${encodeURIComponent(`I earned a certificate in ${course.titleEn || course.titlePs || "a course"} on KabulLearn`)}&summary=${encodeURIComponent("KabulLearn — Learn Without Limits")}`;

  const html = certificateHtml({
    nameEn, namePs, nameFa,
    courseTitleEn, courseTitlePs, courseTitleFa,
    grade: input.grade,
    certUrl, verifyUrl, linkedinUrl,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: user.email,
      subject: `🎓 ${course.titleEn || course.titlePs || "Your certificate"} — Certificate of Completion`,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Certificate email failed:", response.status, body);
  }
}

export async function sendTicketConfirmationEmail(input: {
  email: string;
  name: string;
  ticketNumber: string;
  issueType: string;
  subject: string;
}): Promise<{ sent: boolean }> {
  const apiKey    = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) return { sent: false };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    fromEmail,
      to:      input.email,
      subject: `Support ticket confirmed — ${input.ticketNumber}`,
      html:    ticketConfirmationHtml(input),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Ticket confirmation email failed:", response.status, body);
    return { sent: false };
  }

  return { sent: true };
}
