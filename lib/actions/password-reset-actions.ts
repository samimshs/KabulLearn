"use server";

import { hash } from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createPasswordResetToken,
  emailFromPasswordResetIdentifier,
  hashVerificationToken,
  sendPasswordResetEmail
} from "@/lib/email-verification";
import { assertRateLimit } from "@/lib/security";
import type { Locale } from "@/lib/i18n";

function normalizeLocale(value: FormDataEntryValue | null): Locale {
  return value === "ps" || value === "fa" ? value : "en";
}

const messages = {
  en: {
    validEmail: "Enter a valid email address.",
    genericSent: "If an account exists for that email, we sent a password reset link. Please check your inbox.",
    tooMany: "Too many reset requests. Please wait a moment and try again.",
    missingToken: "This reset link is missing a token. Please request a new link.",
    invalidToken: "This reset link is invalid or has already been used.",
    expiredToken: "This reset link has expired. Please request a new link.",
    passwordMin: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    resetUnavailable: "Unable to reset password right now. Please request a new link.",
    resetSuccess: "Your password has been reset. You can sign in with your new password."
  },
  ps: {
    validEmail: "مهرباني وکړئ سمه ایمیل پته ولیکئ.",
    genericSent: "که د دې ایمیل لپاره حساب موجود وي، موږ د پټنوم د بیا جوړولو لینک درولېږه. مهرباني وکړئ خپل انباکس وګورئ.",
    tooMany: "د بیا جوړولو ډېرې غوښتنې شوي دي. مهرباني وکړئ لږ وروسته بیا هڅه وکړئ.",
    missingToken: "په دې لینک کې ټوکن نشته. مهرباني وکړئ نوی لینک وغواړئ.",
    invalidToken: "دا لینک سم نه دی یا مخکې کارول شوی دی.",
    expiredToken: "دا لینک ختم شوی دی. مهرباني وکړئ نوی لینک وغواړئ.",
    passwordMin: "پټنوم باید لږ تر لږه ۸ توري وي.",
    passwordMismatch: "پټنومونه یو شان نه دي.",
    resetUnavailable: "اوس پټنوم نه شي بیا جوړېدای. مهرباني وکړئ نوی لینک وغواړئ.",
    resetSuccess: "ستاسو پټنوم بیا جوړ شو. اوس د نوي پټنوم سره ننوتلی شئ."
  },
  fa: {
    validEmail: "لطفاً یک آدرس ایمیل معتبر وارد کنید.",
    genericSent: "اگر حسابی با این ایمیل وجود داشته باشد، لینک بازنشانی رمز عبور را فرستادیم. لطفاً ایمیل خود را بررسی کنید.",
    tooMany: "درخواست‌های بازنشانی زیاد شده است. لطفاً کمی بعد دوباره تلاش کنید.",
    missingToken: "این لینک بازنشانی توکن ندارد. لطفاً لینک جدید درخواست کنید.",
    invalidToken: "این لینک بازنشانی درست نیست یا قبلاً استفاده شده است.",
    expiredToken: "این لینک بازنشانی منقضی شده است. لطفاً لینک جدید درخواست کنید.",
    passwordMin: "رمز عبور باید حداقل ۸ حرف باشد.",
    passwordMismatch: "رمزهای عبور یکسان نیستند.",
    resetUnavailable: "فعلاً بازنشانی رمز عبور ممکن نیست. لطفاً لینک جدید درخواست کنید.",
    resetSuccess: "رمز عبور شما بازنشانی شد. می‌توانید با رمز جدید وارد شوید."
  }
} as const;

function requestSchema(locale: Locale) {
  return z.object({
    email: z.string().trim().email(messages[locale].validEmail).transform((value) => value.toLowerCase())
  });
}

function resetSchema(locale: Locale) {
  return z
    .object({
      token: z.string().min(1, messages[locale].missingToken),
      password: z.string().min(8, messages[locale].passwordMin).max(128),
      confirmPassword: z.string().min(8, messages[locale].passwordMin).max(128)
    })
    .refine((value) => value.password === value.confirmPassword, {
      path: ["confirmPassword"],
      message: messages[locale].passwordMismatch
    });
}

export type PasswordResetRequestState = {
  error: string;
  success: boolean;
  message?: string;
};

export type PasswordResetState = {
  error: string;
  success: boolean;
  message?: string;
};

export async function requestPasswordReset(
  _state: PasswordResetRequestState,
  formData: FormData
): Promise<PasswordResetRequestState> {
  const locale = normalizeLocale(formData.get("locale"));
  const m = messages[locale];
  const parsed = requestSchema(locale).safeParse({
    email: String(formData.get("email") || "")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? m.validEmail, success: false };
  }

  const { email } = parsed.data;

  try {
    await assertRateLimit(`password-reset-request:${email}`, 5);
  } catch {
    return { error: m.tooMany, success: false };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { email: true, name: true, status: true }
    });

    if (user && user.status !== UserStatus.SUSPENDED) {
      const token = await createPasswordResetToken(user.email);
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl: token.resetUrl,
        locale
      });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
  }

  return { error: "", success: true, message: m.genericSent };
}

export async function resetPassword(
  _state: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const locale = normalizeLocale(formData.get("locale"));
  const m = messages[locale];
  const parsed = resetSchema(locale).safeParse({
    token: String(formData.get("token") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || "")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? m.resetUnavailable, success: false };
  }

  const tokenHash = hashVerificationToken(parsed.data.token);
  const token = await db.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!token) {
    return { error: m.invalidToken, success: false };
  }

  const email = emailFromPasswordResetIdentifier(token.identifier);
  if (!email) {
    await db.verificationToken.deleteMany({ where: { token: tokenHash } });
    return { error: m.invalidToken, success: false };
  }

  if (token.expires < new Date()) {
    await db.verificationToken.deleteMany({ where: { token: tokenHash } });
    return { error: m.expiredToken, success: false };
  }

  try {
    const passwordHash = await hash(parsed.data.password, 12);
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerified: new Date()
        }
      });

      await tx.verificationToken.deleteMany({
        where: { token: tokenHash }
      });
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: m.resetUnavailable, success: false };
  }

  return { error: "", success: true, message: m.resetSuccess };
}
