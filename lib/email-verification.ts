import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 15 * 60 * 1000;

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

function appBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

export function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && DISPOSABLE_EMAIL_DOMAINS.has(domain));
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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

export async function sendVerificationEmail(input: { email: string; name?: string | null; verifyUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn("Verification email not sent: RESEND_API_KEY or FROM_EMAIL is missing.");
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.email,
      subject: "Verify your KabulLearn account",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#102033">
          <h1 style="margin:0 0 12px">Verify your KabulLearn account</h1>
          <p>Hello ${input.name || "learner"},</p>
          <p>Click the link below to activate your account. This link expires in 15 minutes.</p>
          <p><a href="${input.verifyUrl}" style="display:inline-block;background:#0057ff;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Verify account</a></p>
          <p>If the button does not work, open this URL:</p>
          <p style="word-break:break-all">${input.verifyUrl}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Verification email failed:", response.status, body);
    return { sent: false };
  }

  return { sent: true };
}
