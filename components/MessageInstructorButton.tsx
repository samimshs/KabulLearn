"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { sendDirectMessage } from "@/lib/actions/message-actions";
import { useLanguage } from "@/components/LanguageProvider";

type Props = {
  instructorUserId: string | null;
  instructorName: string;
  viewerId: string | null;
  viewerRole: string | null;
  loginHref: string;
  variant?: "primary" | "ghost";
};

export function MessageInstructorButton({
  instructorUserId,
  instructorName,
  viewerId,
  viewerRole,
  loginHref,
  variant = "primary"
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSending, startSending] = useTransition();

  const firstName = instructorName.split(" ")[0];
  const btnClass = variant === "primary" ? "pr-btn-primary" : "pr-btn-ghost";

  // Don't show if there's no one to message, or you'd be messaging yourself
  if (!instructorUserId || instructorUserId === viewerId) return null;

  const messagesHref =
    viewerRole === "EDUCATOR"
      ? `/educator/messages?to=${encodeURIComponent(instructorUserId)}`
      : `/dashboard/messages?to=${encodeURIComponent(instructorUserId)}`;

  // Not logged in → send them to login first
  if (!viewerId) {
    return (
      <Link href={loginHref} className={btnClass}>
        <MailIcon />
        {t.sendMessage}
      </Link>
    );
  }

  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    startSending(async () => {
      setError("");
      const result = await sendDirectMessage({ recipientId: instructorUserId!, body });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  function closeModal() {
    setOpen(false);
    // reset after the closing animation frame
    setTimeout(() => { setDraft(""); setSent(false); setError(""); }, 150);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass}>
        <MailIcon />
        {t.sendMessage}
      </button>

      {open && (
        <Modal onClose={closeModal}>
          {sent ? (
            <div className="grid gap-4 p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--success)] text-white">
                <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path d="M4 10.5 8 14.5 16 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-[800] text-[var(--ink)]">{t.messageSent}</h3>
                <p className="mt-1 text-[13px] font-[500] text-[var(--muted)]">
                  {t.messageSentHint}
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Link href={messagesHref} className="pr-btn-primary !min-h-10 px-4 text-[13px]">
                  {t.viewConversation}
                </Link>
                <button type="button" onClick={closeModal} className="pr-btn-ghost !min-h-10 px-4 text-[13px]">
                  {t.closePreview}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="pr-eyebrow">{t.newMessage}</p>
                  <h3 className="mt-1 text-[17px] font-[800] text-[var(--ink)]">{instructorName}</h3>
                </div>
                <button type="button" onClick={closeModal} aria-label={t.closePreview} className="text-[var(--muted)] hover:text-[var(--ink)]">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                </button>
              </div>

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                autoFocus
                maxLength={4000}
                placeholder={t.writeMessagePlaceholder}
                className="resize-none rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-[14px] font-[500] leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white"
              />

              {error && (
                <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[12px] font-[700] text-red-700">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="pr-btn-ghost !min-h-10 px-4 text-[13px]">
                  {t.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !draft.trim()}
                  className="pr-btn-primary !min-h-10 px-5 text-[13px] disabled:opacity-50"
                >
                  {isSending ? t.sendingLabel : t.sendMessage}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(10,9,20,0.55)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(10,9,20,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="me-2 h-4 w-4" fill="none" aria-hidden="true">
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v7A1.5 1.5 0 0 1 15.5 14H8l-3.5 2.5V14A1.5 1.5 0 0 1 3 12.5v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
