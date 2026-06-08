"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

const PILLS: Array<{ locale: Locale; code: string; label: string; rtl?: boolean }> = [
  { locale: "en", code: "EN", label: "English" },
  { locale: "ps", code: "PS", label: "پښتو", rtl: true },
  { locale: "fa", code: "DR", label: "دری", rtl: true },
];

export function HeroLangPills() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.language}>
      {PILLS.map((p) => {
        const active = locale === p.locale;
        return (
          <button
            key={p.locale}
            type="button"
            onClick={() => setLocale(p.locale)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-[800] transition ${
              active
                ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]"
                : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--ink-2)]"
            }`}
          >
            <span dir={p.rtl ? "rtl" : undefined}>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
