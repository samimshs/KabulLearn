"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

export type LoginState = {
  error: string;
};

export async function loginWithCredentials(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const rawCallbackUrl = String(formData.get("callbackUrl") || "");
  // Only trust local paths; role-based redirect handles the rest
  const callbackUrl =
    rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "";

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: callbackUrl
    });
  } catch (error) {
    // NEXT_REDIRECT is thrown by redirect() — must rethrow so Next.js handles it
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || (error as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    // DB down or any other unexpected server error — show inline, not crash page
    console.error("Login error:", error);
    return { error: "Unable to sign in right now. Please try again in a moment." };
  }

  // Route through /auth/redirect so the browser sends the new JWT cookie
  // and the server can read role and redirect to the right dashboard
  const params = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
  redirect(`/auth/redirect${params}`);
}

export async function logout() {
  await signOut({
    redirectTo: "/login"
  });
}
