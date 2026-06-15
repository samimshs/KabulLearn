import Link from "next/link";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { getPublicInfoContent } from "@/lib/info-translations";
import { getDirection } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export async function SiteFooter({ rightsReserved }: { rightsReserved: string }) {
  const locale = await getServerLocale();
  const direction = getDirection(locale);
  const content = getPublicInfoContent(locale).footer;
  const session = await auth().catch(() => null);
  const role = session?.user?.role ?? null;
  const groups = content.groups.map((group) => ({
    ...group,
    links: group.links.filter((link) => {
      if (link.studentOnly) return role === UserRole.STUDENT;
      if (link.educatorOnly) return role === UserRole.EDUCATOR;
      return true;
    })
  }));

  return (
    <footer dir={direction} className="mt-16 border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-10 lg:grid-cols-[1.4fr_2.6fr] lg:px-8">
        <div dir="ltr" className="lg:col-start-1 lg:row-start-1">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="KabulLearn home">
            <img src="/poharana-logo-v3.svg" alt="KabulLearn" className="kl-logo-light h-auto w-[168px]" />
            <img src="/poharana-logo-v3-dark.svg" alt="KabulLearn" className="kl-logo-dark h-auto w-[168px]" />
          </Link>
          <p dir="auto" className="mt-4 max-w-sm text-sm font-[600] leading-7 text-[var(--muted)]">
            {content.tagline}
          </p>
          <div className="mt-5 space-y-2 text-sm font-[700] text-[var(--ink-2)]">
            <p dir="auto">
              {content.support}:{" "}
              <a href="mailto:info@kabulhub.com" className="text-[var(--brand)] hover:text-[var(--brand-hover)]">
                info@kabulhub.com
              </a>
            </p>
            <p dir="auto">{content.location}</p>
          </div>
        </div>

        <div dir={direction} className="grid gap-8 sm:grid-cols-3 lg:col-start-2 lg:row-start-1">
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 dir="auto" className="text-sm font-[800] uppercase tracking-[1.5px] text-[var(--ink)]">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm font-[700] text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
                      dir="auto"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs font-[700] text-[var(--muted)] lg:px-8">
          <p dir="auto">{rightsReserved}</p>
          <p dir="auto">{content.operatedBy}</p>
        </div>
      </div>
    </footer>
  );
}
