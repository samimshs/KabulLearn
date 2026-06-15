import Link from "next/link";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { InfoHero, InfoSection } from "@/components/InfoPage";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getServerLocale } from "@/lib/server-locale";

export const metadata = {
  title: "Teach on KabulLearn - KabulLearn",
  description: "Educator onboarding for teaching trilingual courses on KabulLearn."
};

export default async function ForEducatorsPage() {
  const locale = await getServerLocale();
  const content = getPublicInfoContent(locale).educators;
  const session = await auth();
  const isStudent = session?.user?.role === UserRole.STUDENT;
  const isEducator = session?.user?.role === UserRole.EDUCATOR || session?.user?.role === UserRole.ADMIN;

  return (
    <main className="pr-page space-y-6 py-10 lg:py-14">
      <InfoHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      >
        {isEducator ? (
          <Link href={session?.user?.role === UserRole.ADMIN ? "/admin" : "/educator"} className="pr-btn-primary">
            {content.goPortal}
          </Link>
        ) : isStudent ? (
          /* Already logged in as a student — skip registration, go straight to the request form */
          <Link href="/request-educator-access" className="pr-btn-primary">
            {content.requestAccess}
          </Link>
        ) : (
          /* Not logged in — needs an account first */
          <Link href="/register" className="pr-btn-primary">{content.register}</Link>
        )}
        <Link href="/educator-resources" className="pr-btn-ghost">{content.resources}</Link>
      </InfoHero>

      <InfoSection title={content.pipelineTitle}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.steps.map((step) => (
            <article key={step.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg font-[800] text-[var(--ink)]">{step.title}</h3>
              {step.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-sm font-[600] leading-6 text-[var(--muted)]">{paragraph}</p>
              ))}
            </article>
          ))}
        </div>
      </InfoSection>

      <InfoSection title={content.beforeTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {content.before.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </InfoSection>
    </main>
  );
}
