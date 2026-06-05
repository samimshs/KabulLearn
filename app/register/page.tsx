import { RegisterPageContent } from "@/components/RegisterPageContent";

export default function RegisterPage() {
  const googleOAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <RegisterPageContent googleOAuthEnabled={googleOAuthEnabled} />;
}
