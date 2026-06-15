import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { SessionGuard } from "@/components/SessionGuard";
import { LanguageProvider } from "@/components/LanguageProvider";
import { BackButton } from "@/components/BackButton";
import { CourseChatbox } from "@/components/CourseChatbox";
import { SocialFloat } from "@/components/SocialFloat";
import { SiteFooter } from "@/components/SiteFooter";
import { dictionaries, getDirection } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/server-locale";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kabullearn.com"),
  title: "KabulLearn — Learn Without Limits",
  description: "A trilingual LMS for Afghan learners. Structured courses, guided quizzes, and verified certificates in English, Pashto and Dari.",
  icons: { icon: "/poharana-icon-v3.svg", apple: "/poharana-icon-v3.svg" },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: "https://kabullearn.com",
    siteName: "KabulLearn",
    title: "KabulLearn — Learn Without Limits",
    description: "Free structured courses, guided quizzes, and verified certificates in English, Pashto and Dari.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "KabulLearn — Learn Without Limits" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "KabulLearn — Learn Without Limits",
    description: "Free structured courses, guided quizzes, and verified certificates in English, Pashto and Dari.",
    images: ["/og.png"]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KabulLearn"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("poharana-locale")?.value;
  const locale = normalizeLocale(localeCookie);
  const direction = getDirection(locale);
  const t = dictionaries[locale];

  // Authoritative user ID for SessionGuard — clears stale localStorage when user changes
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch { /* auth failure — treat as logged out */ }

  return (
    <html lang={locale} dir={direction} className={manrope.variable} suppressHydrationWarning>
      <head>
        {/* Set theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('kl-theme');if(t==='dark'||(t==null&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}` }} />
      </head>
      <body>
        <LanguageProvider initialLocale={locale}>
          <a href="#main-content" className="kl-skip-link">{t.skipToContent}</a>
          {/* Wipes user-scoped localStorage keys whenever the active user changes */}
          <SessionGuard userId={userId} />
          <Header />
          <BackButton />
          <div id="main-content">{children}</div>
          <SiteFooter rightsReserved={t.rightsReserved} />
          <SocialFloat />
          {userId ? <CourseChatbox /> : null}
        </LanguageProvider>
      </body>
    </html>
  );
}
