"use client";

import { useState } from "react";
import { submitEducatorRequest } from "@/lib/actions/educator-request-actions";
import { useLanguage } from "@/components/LanguageProvider";

export function EducatorRequestForm({ existingMessage }: { existingMessage?: string | null }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState(existingMessage ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const result = await submitEducatorRequest({ message });
    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] px-6 py-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--success)] text-white">
          <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M4 10.5 8 14.5 16 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[18px] font-[800] text-[var(--success)]">{t.requestSubmitted}</h2>
        <p className="mt-2 text-[14px] font-[600] text-[var(--success)]">
          The admin will review your request and upgrade your account. You&apos;ll be able to sign in to the educator portal once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="message" className="text-[14px] font-[800] text-[var(--ink)]">
          {t.educatorRequestLabel}
        </label>
        <p className="text-[12px] font-[600] text-[var(--muted)]">
          {t.educatorRequestHint}
        </p>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={30}
          maxLength={2000}
          rows={6}
          placeholder={t.educatorRequestPlaceholder}
          className="pr-input resize-none text-[14px] leading-relaxed"
        />
        <p className="text-right text-[11px] font-[700] text-[var(--muted-2)]">{message.length}/2000</p>
      </div>

      {status === "error" && (
        <p className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-[13px] font-[700] text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || message.trim().length < 30}
        className="pr-btn-primary w-full"
      >
        {status === "loading" ? t.submittingLabel : t.submitRequest}
      </button>
    </form>
  );
}
