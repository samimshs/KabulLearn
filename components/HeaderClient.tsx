"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LogoutButton } from "@/components/LogoutButton";

type HeaderClientProps = {
  user: { name: string | null; role: string } | null;
};

export function HeaderClient({ user }: HeaderClientProps) {
  const { locale, setLocale, t } = useLanguage();
  const languageOptions = [
    { locale: "ps" as const, label: "پښتو", title: t.pashto },
    { locale: "fa" as const, label: "دری", title: t.dari },
    { locale: "en" as const, label: "EN", title: t.english }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-5 lg:px-8">

        {/* Wordmark */}
        <Link
          href="/"
          className="pr-focus flex h-11 shrink-0 items-center overflow-hidden"
          aria-label="KabulLearn home"
        >
          <img
            src="/poharana-logo-v3.svg"
            alt="KabulLearn"
            className="hidden h-11 w-[166px] max-w-[42vw] object-contain sm:block"
          />
          <img
            src="/poharana-icon-v3.svg"
            alt="KabulLearn"
            className="h-9 w-9 rounded-[10px] shadow-[0_8px_20px_rgba(0,87,255,0.18)] sm:hidden"
          />
        </Link>

        {/* Right side */}
        <div className="flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-2">
          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className="pr-btn-ghost hidden !min-h-9 px-4 sm:inline-flex">
                  Admin
                </Link>
              ) : user.role === "EDUCATOR" ? (
                <Link href="/educator" className="pr-btn-ghost hidden !min-h-9 px-4 sm:inline-flex">
                  Educator portal
                </Link>
              ) : (
                <Link href="/dashboard" className="pr-btn-ghost hidden !min-h-9 px-4 sm:inline-flex">
                  {t.myCourses}
                </Link>
              )}
              <div className="hidden h-5 w-px bg-[var(--border)] sm:block" />
              <span className="hidden max-w-[120px] truncate whitespace-nowrap text-[13px] font-[600] text-[var(--muted)] sm:block">
                {user.name ?? user.role.toLowerCase()}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login?callbackUrl=%2Feducator" className="hidden h-9 items-center rounded-[var(--radius)] px-4 text-[13px] font-[700] text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline-flex">
                {t.educatorPortal}
              </Link>
              <Link href="/login" className="pr-btn-ghost !min-h-9 px-4">
                {t.signIn}
              </Link>
              <Link href="/register" className="pr-btn-primary hidden !min-h-9 px-4 sm:inline-flex">
                {t.registerFree}
              </Link>
            </>
          )}

          {/* Language toggle */}
          <div className="flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm" role="group" aria-label={t.language}>
            {languageOptions.map((option) => (
              <button
                key={option.locale}
                type="button"
                title={option.title}
                onClick={() => setLocale(option.locale)}
                aria-pressed={locale === option.locale}
                className={`flex h-7 min-w-9 items-center justify-center rounded-full px-2.5 text-[12px] font-[900] transition ${
                  locale === option.locale
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
