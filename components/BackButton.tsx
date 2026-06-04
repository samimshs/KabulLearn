"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

const HIDE_ON = new Set(["/", "/auth/redirect"]);

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, direction } = useLanguage();

  if (HIDE_ON.has(pathname)) return null;

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div className="px-5 pt-4 lg:px-8">
      <button
        type="button"
        onClick={handleBack}
        className="group flex items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-[700] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0"
          style={{ transform: direction === "rtl" ? "scaleX(-1)" : "none" }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t.back}
      </button>
    </div>
  );
}
