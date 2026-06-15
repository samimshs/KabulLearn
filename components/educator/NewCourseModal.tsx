"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function NewCourseModal() {
  const { t } = useLanguage();

  return (
    <Link href="/educator/courses/new" className="pr-btn-primary flex items-center gap-2">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      {t.newCourse}
    </Link>
  );
}
