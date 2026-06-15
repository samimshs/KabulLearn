import { Suspense } from "react";
import { LoginPageContent } from "@/components/LoginPageContent";

export default function LoginPage() {
  const googleOAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const facebookOAuthEnabled = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);

  return (
    <Suspense fallback={null}>
      <LoginPageContent googleOAuthEnabled={googleOAuthEnabled} facebookOAuthEnabled={facebookOAuthEnabled} />
    </Suspense>
  );
}
