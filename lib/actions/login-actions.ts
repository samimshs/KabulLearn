"use server";

import { AuthError } from "next-auth";
import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  callbackUrl: z.string().optional()
});

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

export async function loginUser(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    callbackUrl: String(formData.get("callbackUrl") || "")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login details." };
  }

  const { email, password, callbackUrl } = parsed.data;
  const safeCallbackUrl = safeLocalPath(callbackUrl);
  const requiredRole = requiredRoleForPath(safeCallbackUrl);

  try {
    if (requiredRole) {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { role: true, passwordHash: true }
      });

      if (!user?.passwordHash) {
        return { error: "Invalid email or password." };
      }

      const validPassword = await compare(password, user.passwordHash);
      if (!validPassword) {
        return { error: "Invalid email or password." };
      }

      if (user.role !== requiredRole) {
        return { error: "Not authorized" };
      }
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
      return { error: "Invalid email or password." };
    }

    console.error("Login error:", error);
    return { error: "Unable to sign in right now. Please try again in a moment." };
  }

  return { error: "", redirectTo: `/auth/redirect?callbackUrl=${encodeURIComponent(safeCallbackUrl)}` };
}
