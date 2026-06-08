import Link from "next/link";
import { CertificateVerificationLookup } from "@/components/CertificateVerificationLookup";
import { InfoHero, InfoSection, VideoPlaceholder } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";
import { getSiteVideoUrls, VIDEO_KEYS } from "@/lib/actions/site-settings-actions";

export const metadata = {
  title: "Certificate Verification - KabulLearn",
  description: "Verify KabulLearn certificates by certificate ID, verification code, or QR verification link."
};

export default async function CertificateVerificationPage() {
  const [locale, videos] = await Promise.all([getServerLocale(), getSiteVideoUrls()]);
  const content = getPublicInfoContent(locale).certificate;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        <Link href="/courses" className="pr-btn-primary">{content.exploreCourses}</Link>
        <Link href="/support" className="pr-btn-ghost">{content.reportIssue}</Link>
      </InfoHero>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <InfoSection title={content.verifyTitle}>
          <p>{content.verifyDescription}</p>
          <CertificateVerificationLookup
            label={content.lookupLabel}
            placeholder={content.lookupPlaceholder}
            errorMessage={content.lookupError}
            buttonLabel={content.lookupButton}
          />
        </InfoSection>

        <InfoSection title={content.meaningTitle}>
          {content.meaningParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </InfoSection>
      </section>

      <InfoSection title={content.walkthroughTitle}>
        <VideoPlaceholder
          title={content.videoTitle}
          description={content.videoDescription}
          youtubeUrl={videos[VIDEO_KEYS.certificateVerification]}
        />
      </InfoSection>
    </main>
  );
}
