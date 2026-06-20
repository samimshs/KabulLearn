"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: number | null;
  badgeTone?: "warning" | "purple";
};

export function AdminSidebarNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const thresholds = new Map<string, number>();

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          thresholds.set(id, entry.intersectionRatio);
          let best = "";
          let bestRatio = -1;
          thresholds.forEach((ratio, key) => {
            if (ratio > bestRatio) { bestRatio = ratio; best = key; }
          });
          if (best) setActive(best);
        },
        { threshold: [0, 0.1, 0.3, 0.5], rootMargin: "-10% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-52 shrink-0 flex-col bg-[#07111f] overflow-y-auto z-10">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-[#1a2942]">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--brand)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-[900] text-white leading-none">KabulLearn</p>
              <p className="mt-0.5 text-[10px] font-[700] uppercase tracking-[1.2px] text-[#4d6a8a]">Admin console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActive(item.id)}
                className={`group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-[700] transition-all ${
                  isActive
                    ? "bg-[#0057FF] text-white"
                    : "text-[#7a94b3] hover:bg-[#0e1f35] hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                  <path d={item.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-[900] leading-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : item.badgeTone === "purple"
                        ? "bg-[rgba(124,58,237,0.2)] text-[#a78bfa]"
                        : "bg-[rgba(217,119,6,0.2)] text-[#fbbf24]"
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="px-3 py-4 border-t border-[#1a2942] space-y-0.5">
          <Link href="/" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[12px] font-[700] text-[#4d6a8a] hover:text-white hover:bg-[#0e1f35] transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            View site
          </Link>
          <Link href="/admin/audit" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[12px] font-[700] text-[#4d6a8a] hover:text-white hover:bg-[#0e1f35] transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Audit logs
          </Link>
        </div>
      </aside>

      {/* Mobile horizontal nav */}
      <nav className="lg:hidden sticky top-0 z-10 flex gap-1 overflow-x-auto bg-[#07111f] px-3 py-2 scrollbar-none">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActive(item.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-[800] whitespace-nowrap transition ${
              active === item.id
                ? "bg-[var(--brand)] text-white"
                : "text-[#7a94b3] hover:text-white"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span className="rounded-full bg-white/20 px-1 text-[9px] font-[900]">{item.badge}</span>
            ) : null}
          </a>
        ))}
      </nav>
    </>
  );
}
