"use client";

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, getDirection, type Dictionary, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  direction: "ltr" | "rtl";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children, initialLocale = "en" }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const direction = getDirection(locale);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    document.cookie = `poharana-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  }

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const value = useMemo(
    () => ({
      locale,
      direction,
      t: dictionaries[locale],
      setLocale
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
