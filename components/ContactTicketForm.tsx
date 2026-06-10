"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function ContactTicketForm() {
  const { t } = useLanguage();

  const issueTypes = [
    t.ticketIssueAccount,
    t.ticketIssueCourseAccess,
    t.ticketIssueVideo,
    t.ticketIssueQuiz,
    t.ticketIssueCertificate,
    t.ticketIssueEducator,
    t.ticketIssuePrivacy,
    t.ticketIssueOther,
  ];

  const [loadedAt, setLoadedAt]         = useState(0);
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [issueType, setIssueType]       = useState("");
  const [subject, setSubject]           = useState("");
  const [description, setDescription]   = useState("");
  const [screenshot, setScreenshot]     = useState<File | null>(null);
  const [screenshotPreview, setPreview] = useState<string | null>(null);
  const [isPending, setIsPending]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLoadedAt(Date.now()); }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setScreenshot(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  function removeFile() {
    setScreenshot(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = new FormData();
    form.append("_t",  String(loadedAt));
    form.append("_hp", "");
    form.append("name",        name);
    form.append("email",       email);
    form.append("issueType",   issueType);
    form.append("subject",     subject);
    form.append("description", description);
    if (screenshot) form.append("screenshot", screenshot);

    try {
      const res  = await fetch("/api/contact-ticket", { method: "POST", body: form });
      const data = await res.json() as { ok: boolean; ticketNumber?: string; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setTicketNumber(data.ticketNumber ?? null);
      }
    } catch {
      setError(t.ticketNetworkError);
    } finally {
      setIsPending(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[rgba(24,130,92,0.2)] bg-[var(--success-50)] p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--success)] text-white">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-[800] text-[var(--ink)]">{t.ticketSuccessTitle}</h3>
        <p className="mt-1 text-sm font-[600] text-[var(--muted)]">{t.ticketSuccessBody}</p>
        <div className="mt-5 inline-block rounded-[var(--radius)] border border-[rgba(24,130,92,0.25)] bg-white px-6 py-4">
          <p className="text-[11px] font-[800] uppercase tracking-[1.5px] text-[var(--muted)]">{t.ticketNumberLabel}</p>
          <p className="mt-1 text-3xl font-[900] tracking-[2px] text-[var(--success)]">{ticketNumber}</p>
        </div>
        <p className="mt-5 text-[13px] font-[600] text-[var(--muted)]">{t.ticketSaveNote}</p>
      </div>
    );
  }

  const inputClass =
    "h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm font-[600] text-[var(--ink)] placeholder:text-[var(--muted-2)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-100)]";

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">

      {/* Honeypot — off-screen, not display:none so bots still render & fill it */}
      <input
        type="text"
        name="_hp_field"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
      />

      {/* Name + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-[13px] font-[800] text-[var(--ink)]">
            {t.ticketName} <span className="text-[var(--danger)]" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.ticketNamePlaceholder}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-[13px] font-[800] text-[var(--ink)]">
            {t.ticketEmail} <span className="text-[var(--danger)]" aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Issue type + Subject */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-[13px] font-[800] text-[var(--ink)]">
            {t.ticketIssueType} <span className="text-[var(--danger)]" aria-hidden="true">*</span>
          </label>
          <select
            required
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>{t.ticketSelectCategory}</option>
            {issueTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-[13px] font-[800] text-[var(--ink)]">
            {t.ticketSubject} <span className="text-[var(--danger)]" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t.ticketSubjectPlaceholder}
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-1.5">
        <label className="text-[13px] font-[800] text-[var(--ink)]">
          {t.ticketDescription} <span className="text-[var(--danger)]" aria-hidden="true">*</span>
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.ticketDescriptionPlaceholder}
          rows={5}
          className="w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-[600] text-[var(--ink)] placeholder:text-[var(--muted-2)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-100)]"
        />
      </div>

      {/* Screenshot upload */}
      <div className="grid gap-1.5">
        <label className="text-[13px] font-[800] text-[var(--ink)]">
          {t.ticketScreenshot}{" "}
          <span className="text-[11px] font-[600] text-[var(--muted)]">({t.ticketScreenshotHint})</span>
        </label>

        {!screenshot ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-full items-center justify-center gap-2.5 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm font-[700] text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            {t.ticketAttach}
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
            {screenshotPreview && (
              <img src={screenshotPreview} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
            )}
            <p className="min-w-0 flex-1 truncate text-sm font-[700] text-[var(--ink-2)]">{screenshot.name}</p>
            <button
              type="button"
              onClick={removeFile}
              aria-label={t.ticketRemoveScreenshot}
              className="shrink-0 text-[var(--muted)] transition hover:text-[var(--danger)]"
            >
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M15 5 5 15M5 5l10 10" />
              </svg>
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
        />
      </div>

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[700] text-[var(--danger)]"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="pr-btn-primary w-full !min-h-11">
        {isPending ? t.ticketSubmitting : t.ticketSubmit}
      </button>

      <p className="text-center text-[12px] font-[600] text-[var(--muted)]">
        {t.ticketResponseNote}
      </p>
    </form>
  );
}
