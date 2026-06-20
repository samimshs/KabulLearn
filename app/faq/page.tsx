import Link from "next/link";
import type { Metadata } from "next";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getSiteVideoUrls } from "@/lib/actions/site-settings-actions";
import { getServerLocale } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "FAQ — KabulLearn",
  description: "Frequently asked questions about KabulLearn — for learners, course creators, and certificate verifiers.",
};

export default async function FaqPage() {
  const [locale, videos] = await Promise.all([
    getServerLocale(),
    getSiteVideoUrls().catch(() => ({} as Record<string, string>)),
  ]);

  const c = getPublicInfoContent(locale).faq;
  const isRtl = locale === "ps" || locale === "fa";

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">

      {/* Hero */}
      <section className="pr-panel px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        <p className="pr-eyebrow">{c.eyebrow}</p>
        <h1 className="pr-h1 mt-4 max-w-3xl">{c.title}</h1>
        <p className="pr-copy mt-5 max-w-2xl text-base">{c.description}</p>
      </section>

      {/* FAQ items */}
      <section className="pr-card p-6 sm:p-8">
        <div className="grid gap-4">
          {c.items.map((item) => {
            const videoUrl = item.videoKey ? videos[item.videoKey] : undefined;
            return (
              <details
                key={item.question}
                className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]"
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-[800] text-[var(--ink)] marker:content-none"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <span>{item.question}</span>
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[var(--brand)] transition group-open:rotate-45"
                    aria-hidden="true"
                  >+</span>
                </summary>
                <div
                  className="border-t border-[var(--border)] px-5 py-4 space-y-4"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <p className="text-[15px] font-[500] leading-8 text-[var(--muted)]">{item.answer}</p>
                  {videoUrl && (
                    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                          title={item.question}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Contact note */}
      <section className="pr-card p-6 sm:p-8 text-center">
        <p className="text-[15px] font-[600] text-[var(--muted)]">
          {c.contactNote.split("info@kabulhub.com")[0]}
          <a
            href="mailto:info@kabulhub.com"
            className="font-[700] text-[var(--brand)] hover:underline underline-offset-2"
          >
            info@kabulhub.com
          </a>
          {c.contactNote.split("info@kabulhub.com")[1]}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/courses" className="pr-btn-primary">
            {locale === "ps" ? "کورسونه وپلټئ" : locale === "fa" ? "مرور دوره‌ها" : "Browse Courses"}
          </Link>
          <Link href="/contact" className="pr-btn-ghost">
            {locale === "ps" ? "اړیکه" : locale === "fa" ? "تماس" : "Contact Us"}
          </Link>
        </div>
      </section>

    </main>
  );
}

function extractYoutubeId(url: string): string {
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([^&]+)/);
  if (longMatch) return longMatch[1];
  return url;
}
