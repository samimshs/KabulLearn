"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "lg" | "xl";
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, size = "lg", children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const maxW = size === "sm" ? "max-w-lg" : size === "xl" ? "max-w-6xl" : "max-w-2xl";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-12">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[rgba(10,9,20,0.48)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`relative w-full ${maxW} max-h-[calc(100svh-32px)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[0_32px_80px_rgba(10,9,20,0.18)] sm:max-h-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="modal-title" className="min-w-0 text-[16px] font-[800] tracking-tight text-[var(--ink)] sm:text-[17px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100svh-104px)] overflow-y-auto p-4 sm:max-h-none sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
