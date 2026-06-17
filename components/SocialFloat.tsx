"use client";

import { useEffect, useRef, useState } from "react";

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/kabulhub/",
    bg: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="white" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1.3" fill="white" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/channel/UCiNcbGF1_DVyJ6rtDGMlAdQ",
    bg: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <path
          d="M2.5 8C2.5 5.8 4.3 4 6.5 4h11C19.7 4 21.5 5.8 21.5 8v8c0 2.2-1.8 4-4 4h-11c-2.2 0-4-1.8-4-4V8Z"
          stroke="white"
          strokeWidth="1.6"
        />
        <path d="M10 9.5l6 2.5-6 2.5v-5Z" fill="white" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/124633985/",
    bg: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" stroke="white" strokeWidth="1.6" />
        <path d="M7.5 10.5v6M7.5 7.5v.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 16.5v-4a2.5 2.5 0 0 1 5 0v4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@kabulhub",
    bg: "#1a1a1a",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <path
          d="M13.5 3h3c.4 3.8 3 5 4.5 5.2V11c-1.8 0-3.5-.7-4.5-1.8V17a5.5 5.5 0 1 1-5.5-5.5c.3 0 .7 0 1 .1v3a2.5 2.5 0 1 0 1.5 2.3V3Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61590261102836",
    bg: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <path
          d="M13 21v-7.5h2.8l.5-3H13V8.7C13 7.6 13.5 7 14.7 7H16.5V4.2A19 19 0 0 0 13.8 4C11 4 9.5 5.6 9.5 8.5v2H7v3h2.5V21H13Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    name: "X (Twitter)",
    href: "https://twitter.com/KabulhubLLC",
    bg: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <path
          d="M4 4l6.3 7.2L3.8 20H6.3l5-5.9L15.5 20H20l-6.6-10.1L19.8 4H17.3l-4.5 5.3L9 4H4Z"
          fill="white"
        />
      </svg>
    ),
  },
];

export function SocialFloat() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-6 left-6 z-[39]"
    >
      {/* Social icons — absolutely above the toggle button */}
      <div aria-hidden={!open} className="absolute bottom-full left-0 mb-3 flex flex-col gap-2.5">
        {SOCIALS.map((social, i) => (
          <div
            key={social.name}
            className="transition-all duration-200"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0) scale(1)" : "translateY(10px) scale(0.85)",
              transitionDelay: open ? `${(SOCIALS.length - 1 - i) * 40}ms` : "0ms",
              pointerEvents: open ? "auto" : "none",
            }}
          >
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              tabIndex={open ? 0 : -1}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition-transform duration-150 hover:scale-110 active:scale-95"
              style={{ backgroundColor: social.bg }}
            >
              {social.icon}
              {/* Tooltip — always appears to the right */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[#111] px-2.5 py-1 text-[11px] font-[700] text-white shadow-sm opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                {social.name}
              </span>
            </a>
          </div>
        ))}
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close social links" : "Follow us on social media"}
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-[0_4px_16px_rgba(0,87,255,0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,87,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
      >
        {open ? (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            {/* Share / social-network icon: three connected nodes */}
            <circle cx="15" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5"  cy="5"  r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5"  cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.2 6.3L12.8 8.8M7.2 13.7L12.8 11.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
