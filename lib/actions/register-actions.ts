"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@prisma/client";
import { createVerificationToken, isDisposableEmail, sendVerificationEmail } from "@/lib/email-verification";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128)
});

export type RegisterState = { error: string };

export async function registerUser(
  _state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || "")
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  if (isDisposableEmail(email)) {
    return { error: "Please use a permanent email address." };
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with that email already exists." };
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
    return { error: "Could not create account right now. Please try again." };
  }

  redirect(`/verify-request?email=${encodeURIComponent(email)}`);
}
