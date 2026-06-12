"use server";

import { AuthError } from "next-auth";
import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

function normalizeLocale(value: FormDataEntryValue | null): Locale {
  return value === "ps" || value === "fa" ? value : "en";
}

const messages = {
  en: {
    validEmail: "Enter a valid email address.",
    passwordMin: "Password must be at least 8 characters.",
    invalidLogin: "Invalid login details.",
    userNotFound: "No account found with that email. Please create an account first.",
    invalidCredentials: "Invalid email or password.",
    notAuthorized: "Not authorized.",
    signInUnavailable: "Unable to sign in right now. Please try again in a moment."
  },
  ps: {
    validEmail: "مهرباني وکړئ د برېښنالیک سمه پته ولیکئ.",
    passwordMin: "پټنوم باید لږ تر لږه ۸ توري وي.",
    invalidLogin: "د ننوتلو معلومات سم نه دي.",
    userNotFound: "د دې برېښنالیک لپاره کوم حساب ونه موندل شو. مهرباني وکړئ لومړی حساب جوړ کړئ.",
    invalidCredentials: "برېښنالیک یا پټنوم سم نه دی.",
    notAuthorized: "تاسو اجازه نه لرئ.",
    signInUnavailable: "اوس ننوتل ممکن نه دي. مهرباني وکړئ لږ وروسته بیا هڅه وکړئ."
  },
  fa: {
    validEmail: "لطفاً یک آدرس ایمیل معتبر وارد کنید.",
    passwordMin: "رمز عبور باید حداقل ۸ حرف باشد.",
    invalidLogin: "معلومات ورود درست نیست.",
    userNotFound: "هیچ حسابی با این ایمیل یافت نشد. لطفاً ابتدا یک حساب ایجاد کنید.",
    invalidCredentials: "ایمیل یا رمز عبور درست نیست.",
    notAuthorized: "شما اجازه دسترسی ندارید.",
    signInUnavailable: "فعلاً ورود ممکن نیست. لطفاً کمی بعد دوباره تلاش کنید."
  }
} as const;

function loginSchema(locale: Locale) {
  const m = messages[locale];

  return z.object({
    email: z.string().trim().email(m.validEmail),
    password: z.string().min(8, m.passwordMin),
    portal: z.enum(["student", "educator", "admin"]).default("student"),
    callbackUrl: z.string().optional()
  });
}

export type LoginState = {
  error: string;
  redirectTo?: string;
};

function safeLocalPath(value: string | undefined) {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/";
}

function requiredRoleForPath(path: string) {
  if (path.startsWith("/admin")) return UserRole.ADMIN;
  if (path.startsWith("/educator")) return UserRole.EDUCATOR;
  return null;
}

function requiredRoleForPortal(portal: "student" | "educator" | "admin") {
  if (portal === "admin") return UserRole.ADMIN;
  if (portal === "educator") return UserRole.EDUCATOR;
  return UserRole.STUDENT;
}

export async function loginUser(_state: LoginState, formData: FormData): Promise<LoginState> {
  const locale = normalizeLocale(formData.get("locale"));
  const m = messages[locale];
  const parsed = loginSchema(locale).safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    portal: String(formData.get("portal") || "student"),
    callbackUrl: String(formData.get("callbackUrl") || "")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? m.invalidLogin };
  }

  const { email, password, callbackUrl, portal } = parsed.data;
  const safeCallbackUrl = safeLocalPath(callbackUrl);
  const portalRole = requiredRoleForPortal(portal);
  const callbackRole = requiredRoleForPath(safeCallbackUrl);
  const requiredRole = callbackRole ?? portalRole;

  if (callbackRole && callbackRole !== portalRole) {
    return { error: m.notAuthorized };
  }

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { role: true, passwordHash: true }
    });

    if (!user) {
      return { error: m.userNotFound };
    }

    if (!user.passwordHash) {
      return { error: m.invalidCredentials };
    }

    const validPassword = await compare(password, user.passwordHash);
    if (!validPassword) {
      return { error: m.invalidCredentials };
    }

    if (user.role !== requiredRole) {
      return { error: m.notAuthorized };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || (error as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: m.invalidCredentials };
    }

    console.error("Login error:", error);
    return { error: m.signInUnavailable };
  }

  return {
    error: "",
    redirectTo: `/auth/redirect?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&portal=${encodeURIComponent(portal)}`
  };
}
