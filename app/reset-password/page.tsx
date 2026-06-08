import { ResetPasswordPageContent } from "@/components/ResetPasswordPageContent";

export const metadata = {
  title: "Reset Password - KabulLearn",
  description: "Choose a new KabulLearn password using your secure reset link."
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return <ResetPasswordPageContent token={params?.token} />;
}
