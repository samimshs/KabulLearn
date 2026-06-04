"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@prisma/client";
import { createVerificationToken, isDisposableEmail, sendVerificationEmail } from "@/lib/email-verification";
import type { Locale } from "@/lib/i18n";

function normalizeLocale(value: FormDataEntryValue | null): Locale {
  return value === "ps" || value === "fa" ? value : "en";
}

const messages = {
  en: {
    nameMin: "Name must be at least 2 characters.",
    validEmail: "Enter a valid email address.",
    passwordMin: "Password must be at least 8 characters.",
    invalidInput: "Invalid input.",
    permanentEmail: "Please use a permanent email address.",
    emailExists: "An account with that email already exists.",
    createUnavailable: "Could not create account right now. Please try again."
  },
  ps: {
    nameMin: "نوم باید لږ تر لږه ۲ توري وي.",
    validEmail: "مهرباني وکړئ سمه ایمیل پته ولیکئ.",
    passwordMin: "پټنوم باید لږ تر لږه ۸ توري وي.",
    invalidInput: "داخل شوي معلومات سم نه دي.",
    permanentEmail: "مهرباني وکړئ دایمي ایمیل پته وکاروئ.",
    emailExists: "په دې ایمیل لا مخکې حساب شته.",
    createUnavailable: "اوس حساب نه شي جوړېدای. مهرباني وکړئ بیا هڅه وکړئ."
  },
  fa: {
    nameMin: "نام باید حداقل ۲ حرف باشد.",
    validEmail: "لطفاً یک آدرس ایمیل معتبر وارد کنید.",
    passwordMin: "رمز عبور باید حداقل ۸ حرف باشد.",
    invalidInput: "معلومات واردشده درست نیست.",
    permanentEmail: "لطفاً از یک آدرس ایمیل دائمی استفاده کنید.",
    emailExists: "با این ایمیل قبلاً حساب ساخته شده است.",
    createUnavailable: "فعلاً ساخت حساب ممکن نیست. لطفاً دوباره تلاش کنید."
  }
} as const;

function registerSchema(locale: Locale) {
  const m = messages[locale];

  return z.object({
    name: z.string().trim().min(2, m.nameMin).max(80),
    email: z
      .string()
      .trim()
      .email(m.validEmail)
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(8, m.passwordMin)
      .max(128)
  });
}

export type RegisterState = { error: string };

export async function registerUser(
  _state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const locale = normalizeLocale(formData.get("locale"));
  const m = messages[locale];
  const raw = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || "")
  };

  const parsed = registerSchema(locale).safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? m.invalidInput };
  }

  const { name, email, password } = parsed.data;

  if (isDisposableEmail(email)) {
    return { error: m.permanentEmail };
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: m.emailExists };
    }

    const passwordHash = await hash(password, 12);
    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.VERIFICATION_PENDING
      }
    });
    const token = await createVerificationToken(email);
    await sendVerificationEmail({ email, name, verifyUrl: token.verifyUrl });
  } catch {
    return { error: m.createUnavailable };
  }

  redirect(`/verify-request?email=${encodeURIComponent(email)}`);
}
