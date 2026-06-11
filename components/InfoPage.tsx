import type { ReactNode } from "react";
import Link from "next/link";

type InfoHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

type InfoSectionProps = {
  title: string;
  children: ReactNode;
};

type LinkItem = {
  title: string;
  description: string;
  href: string;
  cta?: string;
};

export function InfoHero({ eyebrow, title, description, children }: InfoHeroProps) {
  return (
    <section className="pr-panel px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
      <p className="pr-eyebrow">{eyebrow}</p>
      <h1 className="pr-h1 mt-4 max-w-4xl">{title}</h1>
      <p className="pr-copy mt-5 max-w-3xl text-base">{description}</p>
      {children ? <div className="mt-7 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="pr-card p-6 sm:p-8">
      <h2 className="text-2xl font-[800] tracking-[-0.4px] text-[var(--ink)]">{title}</h2>
      <div className="mt-5 space-y-4 text-sm font-[600] leading-7 text-[var(--muted)]">{children}</div>
    </section>
  );
}

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    let videoId: string | null = null;
    if (url.hostname.includes("youtu.be")) {
      videoId = url.pathname.slice(1).split("?")[0];
    } else if (url.hostname.includes("youtube.com")) {
      videoId = url.searchParams.get("v") ?? url.pathname.split("/").pop() ?? null;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export function VideoPlaceholder({
  title = "Instruction video placeholder",
  description = "Add a short walkthrough video here.",
  youtubeUrl
}: {
  title?: string;
  description?: string;
  youtubeUrl?: string | null;
}) {
  const embedUrl = youtubeUrl ? youtubeEmbedUrl(youtubeUrl) : null;

  if (embedUrl) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-black shadow-[var(--shadow)]">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        {description && (
          <p className="px-5 py-3 text-sm font-[600] text-[var(--muted)]">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid min-h-[220px] place-items-center rounded-[var(--radius-xl)] border border-dashed border-[rgba(0,87,255,0.35)] bg-[linear-gradient(135deg,rgba(0,87,255,0.08),rgba(255,255,255,0.82))] p-6 text-center"
      role="img"
      aria-label={`${title}. ${description}`}
    >
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-[var(--shadow-sm)]">
          <span className="text-xs font-[900] uppercase tracking-[1px]">Play</span>
        </div>
        <p className="mt-4 text-lg font-[800] text-[var(--ink)]">{title}</p>
        <p className="mt-2 max-w-md text-sm font-[600] text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}

export function LinkGrid({ items }: { items: LinkItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,87,255,0.28)] hover:shadow-[var(--shadow)]"
        >
          <h3 className="text-lg font-[800] text-[var(--ink)]">{item.title}</h3>
          <p className="mt-2 text-sm font-[600] leading-6 text-[var(--muted)]">{item.description}</p>
          <span className="mt-4 inline-flex text-sm font-[800] text-[var(--brand)]">
            {item.cta ?? "Open"} <span aria-hidden="true" className="ms-1 transition group-hover:translate-x-0.5">-&gt;</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

