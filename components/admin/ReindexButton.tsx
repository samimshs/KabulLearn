"use client";

import { useState } from "react";

export function ReindexButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ counts: { lessons: number; courses: number; policy: number; guides: number } } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setStatus("running");
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/reindex", { method: "POST" });
      const data = await res.json() as { ok?: boolean; error?: string; counts?: { lessons: number; courses: number; policy: number; guides: number } };
      if (!res.ok) {
        setErrorMsg(data.error ?? `Server error ${res.status}`);
        setStatus("error");
        return;
      }
      setResult({ counts: data.counts! });
      setStatus("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Network error");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={run}
        disabled={status === "running"}
        className="pr-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "running" ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" />
            </svg>
            Indexing…
          </span>
        ) : "Build AI index"}
      </button>

      {status === "done" && result && (
        <p className="text-[13px] font-[700] text-[var(--success)]">
          ✓ {result.counts.lessons} lessons · {result.counts.courses} courses · {result.counts.policy} policy sections · {result.counts.guides} guides indexed
        </p>
      )}
      {status === "error" && (
        <p className="text-[13px] font-[700] text-[var(--danger)]">
          Failed: {errorMsg ?? "Unknown error"}
        </p>
      )}
    </div>
  );
}
