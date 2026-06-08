"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";

function safeLocalPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function portalFromValue(value: FormDataEntryValue | null) {
  return value === "admin" || value === "educator" || value === "student" ? value : "student";
}

export async function signInWithGoogle(formData: FormData) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/login?oauth=not-configured");
  }

  const callbackUrl = safeLocalPath(formData.get("callbackUrl"));
  const portal = portalFromValue(formData.get("portal"));

  await signIn("google", {
    redirectTo: `/auth/redirect?callbackUrl=${encodeURIComponent(callbackUrl)}&portal=${encodeURIComponent(portal)}`
  });
}
