"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CertificateVerificationLookupProps = {
  label: string;
  placeholder: string;
  errorMessage: string;
  buttonLabel: string;
};

export function CertificateVerificationLookup({
  label,
  placeholder,
  errorMessage,
  buttonLabel
}: CertificateVerificationLookupProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function normalizeCode(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      const verifyIndex = parts.findIndex((part) => part === "verify");
      return verifyIndex >= 0 ? parts[verifyIndex + 1] ?? "" : parts.at(-1) ?? "";
    } catch {
      return trimmed;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeCode(code);

    if (!normalized) {
      setError(errorMessage);
      return;
    }

    setError("");
    router.push(`/verify/${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <label htmlFor="certificate-code" className="pr-label">
        {label}
        <input
          id="certificate-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="pr-input"
          placeholder={placeholder}
          autoComplete="off"
        />
      </label>
      {error ? <p className="mt-3 text-sm font-[700] text-[var(--danger)]">{error}</p> : null}
      <button type="submit" className="pr-btn-primary mt-4 w-full sm:w-auto">
        {buttonLabel}
      </button>
    </form>
  );
}
