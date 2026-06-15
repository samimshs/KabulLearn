import Link from "next/link";
import { InfoHero, InfoSection, VideoPlaceholder } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";
import { getSiteVideoUrls } from "@/lib/actions/site-settings-actions";
import { VIDEO_KEYS } from "@/lib/site-settings-keys";

export const metadata = {
  title: "Educator Resources - KabulLearn",
  description: "Public KabulLearn educator resources for course creation, instructor guidelines, and onboarding."
};

export default async function EducatorResourcesPage() {
  const [locale, videos] = await Promise.all([getServerLocale(), getSiteVideoUrls()]);
  const content = getPublicInfoContent(locale).educatorResources;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <Link href="/educator-guidelines" className="pr-btn-primary">{content.openGuidelines}</Link>
        <Link href="/for-educators" className="pr-btn-ghost">{content.becomeEducatorLink}</Link>
      </InfoHero>

      <InfoSection title={content.workflowTitle}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.steps.map((step) => (
            <article key={step.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg font-[900] text-[var(--ink)]">{step.title}</h3>
              {step.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-sm font-[650] leading-6 text-[var(--muted)]">{paragraph}</p>
              ))}
            </article>
          ))}
        </div>
      </InfoSection>

      <InfoSection title={content.checklistTitle}>
        <ul className="grid gap-3 text-sm font-[650] leading-6 text-[var(--muted)] md:grid-cols-2">
          {content.checklist.map((item) => (
            <li key={item} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">{item}</li>
          ))}
        </ul>
      </InfoSection>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Link
          href="/educator-guidelines"
          className="group rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.28)] hover:shadow-[var(--shadow)]"
        >
          <h2 className="text-2xl font-[900] tracking-[-0.5px] text-[var(--ink)]">{content.guidelinesTitle}</h2>
          <p className="mt-2 text-sm font-[650] leading-7 text-[var(--muted)]">{content.guidelinesDescription}</p>
          <span className="mt-5 inline-flex text-sm font-[900] text-[var(--brand)] group-hover:text-[var(--brand-hover)]">
            {content.openGuidelines} <span aria-hidden="true" className="ms-1">-&gt;</span>
          </span>
        </Link>

        <VideoPlaceholder title={content.videoTitle} description={content.videoDescription} youtubeUrl={videos[VIDEO_KEYS.educatorResources]} />
      </section>
    </main>
  );
}
