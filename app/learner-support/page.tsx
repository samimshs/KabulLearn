import Link from "next/link";
import { InfoHero, InfoSection, VideoPlaceholder } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";
import { getSiteVideoUrls } from "@/lib/actions/site-settings-actions";
import { VIDEO_KEYS } from "@/lib/site-settings-keys";

export const metadata = {
  title: "Learner Support - KabulLearn",
  description: "Help for KabulLearn learners using courses, video lessons, quizzes, accounts, and certificates."
};

export default async function LearnerSupportPage() {
  const [locale, videos] = await Promise.all([getServerLocale(), getSiteVideoUrls()]);
  const content = getPublicInfoContent(locale).support;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        <Link href="/courses" className="pr-btn-primary">{content.goCourses}</Link>
        <Link href="/contact" className="pr-btn-ghost">{content.contactSupport}</Link>
      </InfoHero>

      <InfoSection title={content.walkthroughTitle}>
        <VideoPlaceholder
          title={content.videoTitle}
          description={content.videoDescription}
          youtubeUrl={videos[VIDEO_KEYS.studentWalkthrough]}
        />
      </InfoSection>
    </main>
  );
}
