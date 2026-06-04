import type { Dictionary } from "@/lib/i18n";

type Props = { dict: Dictionary };

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);

const CheckboxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const RosetteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="5" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const pillars = [
  {
    Icon: GlobeIcon,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    titleKey: "pillar1Title" as const,
    descKey: "pillar1Desc" as const,
  },
  {
    Icon: CheckboxIcon,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    titleKey: "pillar2Title" as const,
    descKey: "pillar2Desc" as const,
  },
  {
    Icon: RosetteIcon,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    titleKey: "pillar3Title" as const,
    descKey: "pillar3Desc" as const,
  },
] as const;

export default function ValuePillars({ dict }: Props) {
  return (
    <section
      dir="auto"
      className="mx-[-20px] border-y border-[var(--border)] bg-[var(--surface)] lg:mx-[-32px]"
    >
      <div className="grid grid-cols-1 gap-8 px-5 py-12 md:grid-cols-3 lg:px-8">
        {pillars.map(({ Icon, iconBg, iconColor, titleKey, descKey }) => (
          <div
            key={titleKey}
            className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-colors hover:border-[rgba(228,227,242,0.5)] hover:shadow-[var(--shadow-sm)]"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
              <Icon />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
                {dict[titleKey]}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                {dict[descKey]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
