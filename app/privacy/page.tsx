import Link from "next/link";
import { InfoHero, InfoSection } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";

export const metadata = {
  title: "Privacy Policy - KabulLearn",
  description: "How KabulLearn handles account data, learner progress, quiz records, educator information, certificates, and support requests."
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const content = getPublicInfoContent(locale).privacy;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <Link href="/terms" className="pr-btn-primary">{content.terms}</Link>
        <Link href="/contact" className="pr-btn-ghost">{content.help}</Link>
      </InfoHero>

      {content.sections.map((section, index) => (
        <InfoSection
          key={section.title}
          id={index === content.sections.length - 1 ? "data-deletion" : undefined}
          title={section.title}
        >
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets ? (
            <ul className="list-disc space-y-2 ps-5">
              {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          ) : null}
        </InfoSection>
      ))}
    </main>
  );
}
