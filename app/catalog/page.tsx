import Link from "next/link";
import { InfoHero, InfoSection, LinkGrid, VideoPlaceholder } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";
import { getSiteVideoUrls, VIDEO_KEYS } from "@/lib/actions/site-settings-actions";

export const metadata = {
  title: "Course Catalog - KabulLearn",
  description: "Browse KabulLearn course categories in mathematics, statistics, data science, AI, computer basics, and software skills."
};

export default async function CatalogPage() {
  const [locale, videos] = await Promise.all([getServerLocale(), getSiteVideoUrls()]);
  const content = getPublicInfoContent(locale).catalog;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        <Link href="/courses" className="pr-btn-primary">{content.openAll}</Link>
        <Link href="/learner-support" className="pr-btn-ghost">{content.learnerSupport}</Link>
      </InfoHero>

      <InfoSection title={content.categoriesTitle}>
        <LinkGrid items={content.categories} />
      </InfoSection>

      <InfoSection title={content.walkthroughTitle}>
        <VideoPlaceholder
          title={content.videoTitle}
          description={content.videoDescription}
          youtubeUrl={videos[VIDEO_KEYS.catalog]}
        />
      </InfoSection>
    </main>
  );
}
