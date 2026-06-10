import Link from "next/link";
import { InfoHero, InfoSection, VideoPlaceholder } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";
import { getSiteVideoUrls } from "@/lib/actions/site-settings-actions";
import { VIDEO_KEYS } from "@/lib/site-settings-keys";

export const metadata = {
  title: "Instructor Guidelines - KabulLearn",
  description: "KabulLearn instructor guidelines for recording, formatting, uploading, and publishing trilingual learning content."
};

export default async function EducatorGuidelinesPage() {
  const [locale, videos] = await Promise.all([getServerLocale(), getSiteVideoUrls()]);
  const content = getPublicInfoContent(locale).educatorGuidelines;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        <Link href="/educator" className="pr-btn-primary">{content.goPortal}</Link>
        <Link href="/for-educators" className="pr-btn-ghost">{content.teach}</Link>
      </InfoHero>

      <InfoSection title={content.walkthroughTitle}>
        <VideoPlaceholder
          title={content.videoTitle}
          description={content.videoDescription}
          youtubeUrl={videos[VIDEO_KEYS.educatorGuidelines]}
        />
      </InfoSection>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoSection title={content.structureTitle}>
          <ul className="list-disc space-y-2 ps-5">
            {content.structureItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </InfoSection>

        <InfoSection title={content.recordingTitle}>
          <ul className="list-disc space-y-2 ps-5">
            {content.recordingItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </InfoSection>

        <InfoSection title={content.trilingualTitle}>
          <ul className="list-disc space-y-2 ps-5">
            {content.trilingualItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </InfoSection>

        <InfoSection title={content.quizTitle}>
          <ul className="list-disc space-y-2 ps-5">
            {content.quizItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </InfoSection>
      </section>

      <InfoSection title={content.ownershipTitle}>
        {content.ownershipParagraphs.map((p) => <p key={p}>{p}</p>)}
      </InfoSection>

      <InfoSection title={content.checklistTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {content.checklistItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </InfoSection>
    </main>
  );
}
