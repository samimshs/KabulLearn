"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { CourseCreateForm } from "./CourseCreateForm";
import { useLanguage } from "@/components/LanguageProvider";

export function NewCourseModal() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pr-btn-primary flex items-center gap-2"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        {t.newCourse}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={t.startCourseDraft} size="xl">
        <CourseCreateForm className="grid gap-5" />
      </Modal>
    </>
  );
}
