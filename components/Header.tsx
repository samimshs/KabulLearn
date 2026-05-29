"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function Header() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-[#fffdfa]/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-0">
          <img src="/poharana-icon-v2.svg" alt="PohaRana" className="h-12 w-12" />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-bold text-[#3d4a5a] sm:inline">{t.language}</span>
          <div className="grid grid-cols-2 rounded-xl border border-stone-300 bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                locale === "en" ? "bg-white text-[#102033] shadow-sm" : "text-[#3d4a5a] hover:text-[#102033]"
              }`}
            >
              En
            </button>
            <button
              type="button"
              onClick={() => setLocale("ps")}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                locale === "ps" ? "bg-white text-[#102033] shadow-sm" : "text-[#3d4a5a] hover:text-[#102033]"
              }`}
            >
              Pa
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
