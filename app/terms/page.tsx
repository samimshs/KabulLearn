import Link from "next/link";
import { InfoHero, InfoSection } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";

export const metadata = {
  title: "Terms of Service - KabulLearn",
  description: "Terms governing KabulLearn accounts, courses, quizzes, certificates, educator content, and platform use."
};

export default async function TermsPage() {
  const locale = await getServerLocale();
  const content = getPublicInfoContent(locale).terms;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <Link href="/privacy" className="pr-btn-primary">{content.privacy}</Link>
        <Link href="/contact" className="pr-btn-ghost">{content.contact}</Link>
      </InfoHero>

      {content.sections.map((section) => (
        <InfoSection key={section.title} title={section.title}>
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
