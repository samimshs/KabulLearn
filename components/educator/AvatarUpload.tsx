"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

interface AvatarUploadProps {
  name: string;
  currentUrl?: string;
  onChange: (url: string) => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

export function AvatarUpload({ name, currentUrl, onChange }: AvatarUploadProps) {
  const inputId = useId();
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStatus("uploading");
    setErrorMsg("");

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setPreview(currentUrl || null);
        setStatus("error");
        setErrorMsg(data.error ?? t.uploadFailedShort);
        return;
      }

      setPreview(data.url);
      onChange(data.url);
      setStatus("idle");
    } catch {
      setPreview(currentUrl || null);
      setStatus("error");
      setErrorMsg(t.uploadFailedNetwork);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-slate-50">
        {preview ? (
          <img src={preview} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-slate-100 text-lg font-[900] text-[var(--brand)]">
            {initials(name || "?")}
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0">
          {status === "uploading" ? (
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" />
            </svg>
          ) : null}
        </span>
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor={inputId}
          aria-disabled={status === "uploading"}
          className="inline-flex h-8 cursor-pointer items-center rounded-[var(--radius)] border border-slate-200 bg-white px-3 text-xs font-[800] text-slate-800 transition hover:border-[var(--brand)] hover:text-[var(--brand)] aria-disabled:pointer-events-none aria-disabled:cursor-wait aria-disabled:opacity-60"
        >
          {status === "uploading" ? t.uploadingAvatar : preview ? t.changePhoto : t.uploadPhoto}
        </label>

        {preview && status !== "uploading" && (
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(""); }}
            className="text-left text-xs font-[700] text-[var(--danger)] hover:underline"
          >
            {t.removePhoto}
          </button>
        )}

        <p className="text-[11px] font-[600] text-[var(--muted)]">{t.photoSizeHint}</p>

        {status === "error" && (
          <p className="text-[11px] font-[800] text-[var(--danger)]">{errorMsg}</p>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  );
}
