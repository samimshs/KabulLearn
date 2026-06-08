import Link from "next/link";
import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { hashVerificationToken } from "@/lib/email-verification";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";

type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: string };

async function verifyToken(rawToken: string | undefined): Promise<VerifyResult> {
  if (!rawToken) {
    return { ok: false, reason: "Missing verification token." };
  }

  const tokenHash = hashVerificationToken(rawToken);
  const token = await db.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!token) {
    return { ok: false, reason: "This verification link is invalid or has already been used." };
  }

  if (token.expires < new Date()) {
    await db.verificationToken.deleteMany({ where: { token: tokenHash } });
    return { ok: false, reason: "This verification link has expired. Please register again or contact support." };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { email: token.identifier },
      data: {
        status: UserStatus.ACTIVE,
        emailVerified: new Date()
      }
    });
    await tx.verificationToken.deleteMany({
      where: { token: tokenHash }
    });
  });

  return { ok: true, email: token.identifier };
}

export default async function VerifyPage({
  searchParams
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const [params, locale] = await Promise.all([searchParams, getServerLocale()]);
  const t = dictionaries[locale];
  const result = await verifyToken(params?.token);

  return (
    <main className="pr-page grid min-h-[70vh] place-items-center">
      <section className="pr-panel max-w-xl p-8 text-center">
        <img src="/poharana-icon-v3.svg" alt="" className="mx-auto h-14 w-14 rounded-[16px]" />
        <p className={`pr-eyebrow mt-6 ${result.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {result.ok ? t.accountVerified : t.verificationFailed}
        </p>
        <h1 className="pr-h1 mt-4">
          {result.ok ? t.readyToLearn : t.couldNotVerifyLink}
        </h1>
        <p className="pr-copy mt-5">
          {result.ok ? t.emailIsNowActive : result.reason}
        </p>
        <Link href="/login" className="pr-btn-primary mt-8">
          {t.goToLogin}
        </Link>
      </section>
    </main>
  );
}
