"use client";

import { useState, useTransition } from "react";
import { saveSiteVideoUrl } from "@/lib/actions/site-settings-actions";
import { VIDEO_KEYS } from "@/lib/site-settings-keys";

type VideoEntry = {
  key: string;
  label: string;
  page: string;
  initialValue?: string;
};

function VideoRow({ entry }: { entry: VideoEntry }) {
  const [value, setValue] = useState(entry.initialValue ?? "");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    setStatus("");
    startTransition(async () => {
      const result = await saveSiteVideoUrl({ key: entry.key, value });
      setStatus(result.ok ? "Saved." : result.error);
    });
  }

  return (
    <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4">
      <div>
        <p className="text-sm font-[800] text-[var(--ink)]">{entry.label}</p>
        <p className="text-xs font-[700] text-[var(--muted)]">{entry.page}</p>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus(""); }}
          placeholder="https://www.youtube.com/watch?v=…"
          className="min-w-0 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-[700] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-[var(--radius)] bg-[var(--brand)] px-3 py-2 text-xs font-[800] text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-60"
        >
          {isPending ? "…" : "Save"}
        </button>
      </div>
      {status && <p className="text-xs font-[700] text-[var(--success)]">{status}</p>}
    </div>
  );
}

export function AdminSiteVideosForm({ currentValues }: { currentValues: Record<string, string> }) {
  const entries: VideoEntry[] = [
    { key: VIDEO_KEYS.learnerSupport,          label: "Learner support walkthrough",      page: "/learner-support" },
    { key: VIDEO_KEYS.educatorResources,       label: "Educator resources overview",      page: "/educator-resources" },
    { key: VIDEO_KEYS.educatorGuidelines,      label: "Instructor guidelines walkthrough",page: "/educator-guidelines" },
    { key: VIDEO_KEYS.catalog,                 label: "Course catalog introduction",      page: "/catalog" },
    { key: VIDEO_KEYS.certificateVerification, label: "Certificate verification demo",    page: "/certificate-verification" },
  ];

  return (
    <div className="grid gap-3">
      {entries.map((e) => (
        <VideoRow key={e.key} entry={{ ...e, initialValue: currentValues[e.key] ?? "" }} />
      ))}
    </div>
  );
}
