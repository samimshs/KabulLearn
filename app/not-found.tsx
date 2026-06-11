import Link from "next/link";
import { dictionaries } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export default async function NotFound() {
  const locale = await getServerLocale();
  const t = dictionaries[locale];

  return (
    <main className="pr-page grid min-h-[60vh] place-items-center">
      <section className="pr-panel w-full max-w-xl p-10 text-center">
        <p className="text-[64px] font-[800] leading-none tracking-[-2px] text-[var(--brand)]">404</p>
        <h1 className="pr-h1 mt-4">{t.notFoundTitle}</h1>
        <p className="pr-copy mt-4">{t.notFoundBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="pr-btn-primary">{t.notFoundCta}</Link>
          <Link href="/courses" className="pr-btn-ghost">{t.viewAllCourses}</Link>
        </div>
      </section>
    </main>
  );
}
