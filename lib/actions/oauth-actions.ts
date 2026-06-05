"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function signInWithGoogle() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/login?oauth=not-configured");
  }

  await signIn("google", {
    redirectTo: "/dashboard"
  });
}
