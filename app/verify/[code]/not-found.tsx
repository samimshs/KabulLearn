import Link from "next/link";
import { dictionaries } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export default async function CertificateNotFound() {
  const locale = await getServerLocale();
  const t = dictionaries[locale];

  return (
    <main className="pr-page grid min-h-[60vh] place-items-center">
      <section className="pr-panel w-full max-w-xl p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--warning-50)] text-[var(--warning)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
            <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m9 13-1.5 8L12 19l4.5 2L15 13" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="pr-h1 mt-5">{t.certNotFoundTitle}</h1>
        <p className="pr-copy mt-4">{t.certNotFoundBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/verify" className="pr-btn-primary">{t.certNotFoundCta}</Link>
          <Link href="/" className="pr-btn-ghost">{t.notFoundCta}</Link>
        </div>
      </section>
    </main>
  );
}
