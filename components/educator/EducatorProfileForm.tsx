"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEducatorProfile } from "@/lib/actions/user-actions";

export function EducatorProfileForm({
  name,
  bio,
  image,
  className = "pr-card grid gap-4 p-5 lg:p-6"
}: {
  name?: string | null;
  bio?: string | null;
  image?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: name ?? "", bio: bio ?? "", image: image ?? "" });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateEducatorProfile(form);
          setMessage(result.ok ? "Profile saved." : result.error);
          if (result.ok) router.refresh();
        });
      }}
    >
      <div>
        <p className="pr-eyebrow">Creator profile</p>
        <h2 className="pr-h2 mt-2">Public educator details</h2>
      </div>
      <input className="pr-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Display name" />
      <textarea className="pr-input min-h-28" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio" />
      <label className="grid gap-2">
        <span className="text-sm font-[800] text-[var(--ink-2)]">Photo URL</span>
        <input className="pr-input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/photo.jpg" />
        <span className="text-xs font-[700] text-[var(--muted)]">
          Use a hosted image URL. Local uploads will be added later with proper file storage.
        </span>
      </label>
      {form.image ? (
        <img src={form.image} alt="" className="h-20 w-20 rounded-full border border-[var(--border)] object-cover" />
      ) : null}
      <button type="submit" disabled={isPending} className="pr-btn-secondary !min-h-10">
        {isPending ? "Saving..." : "Save profile"}
      </button>
      {message ? <p className="text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
    </form>
  );
}
