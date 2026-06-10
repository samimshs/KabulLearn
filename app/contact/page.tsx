import Link from "next/link";
import { InfoHero, InfoSection } from "@/components/InfoPage";
import { ContactTicketForm } from "@/components/ContactTicketForm";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";

export const metadata = {
  title: "Contact & Support - KabulLearn",
  description: "Contact KabulLearn support for learner issues, educator access, certificates, privacy requests, and security concerns."
};

export default async function ContactPage() {
  const locale = await getServerLocale();
  const content = getPublicInfoContent(locale).contact;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        <a href="mailto:info@kabulhub.com" className="pr-btn-primary">{content.emailSupport}</a>
        <Link href="/learner-support" className="pr-btn-ghost">{content.learnerFaq}</Link>
      </InfoHero>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoSection title={content.emailTitle}>
          {content.emailParagraphs.map((paragraph) => (
            <p key={paragraph}>
              {paragraph.includes("info@kabulhub.com") ? (
                <>
                  {paragraph.split("info@kabulhub.com")[0]}
                  <a href="mailto:info@kabulhub.com" className="font-[800] text-[var(--brand)]">info@kabulhub.com</a>
                  {paragraph.split("info@kabulhub.com")[1]}
                </>
              ) : paragraph}
            </p>
          ))}
        </InfoSection>

        <InfoSection title={content.areasTitle}>
          <ul className="list-disc space-y-2 ps-5">
            {content.areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </InfoSection>
      </section>

      <section className="pr-card p-6 sm:p-8">
        <h2 className="text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">{content.ticketFormTitle}</h2>
        <p className="mt-3 text-sm font-[600] leading-7 text-[var(--muted)]">
          {content.ticketFormDescription}
        </p>
        <div className="mt-6">
          <ContactTicketForm />
        </div>
      </section>
    </main>
  );
}
