"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

const HIDE_ON = new Set(["/", "/auth/redirect"]);

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t, direction } = useLanguage();
  const isLogin = pathname === "/login";

  if (HIDE_ON.has(pathname)) return null;

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const backButton = (
      <button
        type="button"
        onClick={handleBack}
        className="group flex items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-[700] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0"
          style={{ transform: direction === "rtl" ? "scaleX(-1)" : "none" }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t.back}
      </button>
  );

  if (isLogin) {
    const languageOptions = [
      { locale: "ps" as const, label: "پښتو", title: t.pashto },
      { locale: "fa" as const, label: "دری", title: t.dari },
      { locale: "en" as const, label: "EN", title: t.english }
    ];

    return (
      <div dir="ltr" className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 pt-3 lg:px-8">
        {backButton}
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
    );
  }

  return (
    <div className="px-5 pt-2 lg:px-8 lg:pt-3">
      {backButton}
    </div>
  );
}
