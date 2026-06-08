import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getServerLocale } from "@/lib/server-locale";
import { dictionaries } from "@/lib/i18n";

export default async function CertificateVerificationPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const [{ code }, locale] = await Promise.all([params, getServerLocale()]);
  const t = dictionaries[locale];
  const decodedCode = decodeURIComponent(code);
  const certificate = await db.certificate.findFirst({
    where: {
      OR: [
        { uuid: decodedCode },
        { verificationCode: decodedCode }
      ]
    },
    select: {
      uuid: true,
      verificationCode: true,
      grade: true,
      issuedAt: true,
      user: { select: { name: true, email: true } },
      course: { select: { titleEn: true, titlePs: true } }
    }
  });

  if (!certificate) {
    notFound();
  }

  return (
    <main className="pr-page grid min-h-[70vh] place-items-center">
      <section className="pr-panel w-full max-w-3xl p-8 lg:p-10">
        <p className="pr-eyebrow">{t.certVerificationEyebrow}</p>
        <h1 className="pr-h1 mt-4">{t.certVerifiedTitle}</h1>
        <div className="mt-6 grid gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5">
          <div>
            <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.learnerLabel}</p>
            <p className="mt-1 text-xl font-[800] text-[var(--ink)]">{certificate.user.name ?? certificate.user.email}</p>
          </div>
          <div>
            <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.courseLabel}</p>
            <p className="mt-1 text-xl font-[800] text-[var(--ink)]">{certificate.course.titleEn}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.gradeLabel}</p>
              <p className="mt-1 font-[800] text-[var(--success)]">{certificate.grade}%</p>
            </div>
            <div>
              <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.issuedLabel2}</p>
              <p className="mt-1 font-[800] text-[var(--ink-2)]">{certificate.issuedAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">{t.codeLabel}</p>
              <p className="mt-1 break-all font-mono text-xs font-[800] text-[var(--ink-2)]">{certificate.uuid}</p>
            </div>
          </div>
        </div>
        <Link href="/" className="pr-btn-primary mt-6">
          {t.backToCoursesList}
        </Link>
      </section>
    </main>
  );
}
