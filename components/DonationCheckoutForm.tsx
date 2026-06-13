"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const presetAmounts = [500, 1000, 2500, 5000];

export function DonationCheckoutForm() {
  const { t } = useLanguage();
  const [amountCents, setAmountCents] = useState(1000);
  const [customUsd, setCustomUsd] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const activeAmount = customUsd.trim()
    ? Math.round(Number(customUsd) * 100)
    : amountCents;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!Number.isFinite(activeAmount) || activeAmount < 100) {
      setMessage(t.donationInvalidAmount);
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/stripe/checkout/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: activeAmount,
          donorName: donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined
        })
      });
      const result = (await response.json()) as { ok: boolean; error?: string; data?: { url?: string } };

      if (!response.ok || !result.ok || !result.data?.url) {
        setMessage(result.error ?? t.donationCheckoutError);
        return;
      }

      window.location.href = result.data.url;
    } catch {
      setMessage(t.donationCheckoutError);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 grid max-w-xl gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-5 text-start shadow-[var(--shadow-sm)]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => { setAmountCents(amount); setCustomUsd(""); }}
            className={`min-h-11 rounded-xl border px-3 text-sm font-[900] transition ${
              !customUsd && amountCents === amount
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)]"
            }`}
          >
            ${(amount / 100).toLocaleString("en-US")}
          </button>
        ))}
      </div>
      <label className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
        {t.customDonationAmount}
        <input
          value={customUsd}
          onChange={(event) => setCustomUsd(event.target.value)}
          type="number"
          inputMode="decimal"
          min="1"
          step="0.01"
          placeholder="100.00"
          className="pr-input"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
          {t.donorNameLabel}
          <input value={donorName} onChange={(event) => setDonorName(event.target.value)} className="pr-input" />
        </label>
        <label className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
          {t.donorEmailLabel}
          <input value={donorEmail} onChange={(event) => setDonorEmail(event.target.value)} type="email" className="pr-input" />
        </label>
      </div>
      <p className="rounded-[var(--radius)] border border-[rgba(0,87,255,0.12)] bg-[var(--brand-50)] px-4 py-3 text-xs font-[700] leading-6 text-[var(--ink-2)]">
        {t.donationNameConsent}
      </p>
      {message ? (
        <p className="rounded-[var(--radius)] border border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] px-4 py-3 text-sm font-[800] text-[var(--danger)]">
          {message}
        </p>
      ) : null}
      <button type="submit" disabled={isPending} className="pr-btn-primary justify-center">
        {isPending ? t.redirectingToCheckout : t.donateWithStripe}
      </button>
    </form>
  );
}
