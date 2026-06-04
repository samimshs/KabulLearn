"use client";

import { useRef, useState } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
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
        setErrorMsg(data.error ?? "Upload failed. Try again.");
        return;
      }

      setPreview(data.url);
      onChange(data.url);
      setStatus("idle");
    } catch {
      setPreview(currentUrl || null);
      setStatus("error");
      setErrorMsg("Upload failed. Check your connection and try again.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-[var(--border)] transition hover:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        title="Click to upload photo"
        aria-label="Upload instructor photo"
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--brand-50)] text-lg font-[900] text-[var(--brand)]">
            {initials(name || "?")}
          </span>
        )}

        {/* Upload overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition hover:bg-black/30">
          {status === "uploading" ? (
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </span>
      </button>

      {/* Text actions */}
      <div className="grid gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className="inline-flex h-8 items-center rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-xs font-[800] text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-wait disabled:opacity-60"
        >
          {status === "uploading" ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
        </button>

        {preview && status !== "uploading" && (
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(""); }}
            className="text-left text-xs font-[700] text-[var(--danger)] hover:underline"
          >
            Remove photo
          </button>
        )}

        <p className="text-[11px] font-[600] text-[var(--muted)]">JPG, PNG or WebP · max 3 MB</p>

        {status === "error" && (
          <p className="text-[11px] font-[800] text-[var(--danger)]">{errorMsg}</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  );
}
