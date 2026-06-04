import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/components/LanguageProvider";
import { BackButton } from "@/components/BackButton";
import { dictionaries, getDirection } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/server-locale";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "KabulLearn — Learn Without Limits",
  description: "A trilingual LMS for Afghan learners. Structured courses, guided quizzes, and verified certificates in English, Pashto and Dari.",
  icons: { icon: "/poharana-icon-v3.svg" }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("poharana-locale")?.value;
  const locale = normalizeLocale(localeCookie);
  const direction = getDirection(locale);
  const t = dictionaries[locale];

  return (
    <html lang={locale} dir={direction} className={manrope.variable}>
      <body>
        <LanguageProvider initialLocale={locale}>
          <Header />
          <BackButton />
          {children}
          <footer className="mt-16 border-t border-[var(--border)] bg-[var(--card)]">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-6 text-[13px] font-[600] text-[var(--muted)] lg:px-8">
              <p>{t.rightsReserved}</p>
              <p>
                {t.questions}{" "}
                <a
                  href="mailto:info@kabullearn.com"
                  className="font-[700] text-[var(--brand)] transition-colors hover:text-[var(--brand-hover)]"
                >
                  info@kabullearn.com
                </a>
              </p>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
