"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "./Modal";
import { EducatorProfileForm } from "./EducatorProfileForm";
import { useLanguage } from "@/components/LanguageProvider";

type Props = { name?: string | null; bio?: string | null; image?: string | null };

function Initials({ name }: { name?: string | null }) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return <>{parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "ED"}</>;
}

export function EditProfileModal({ name, bio, image }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]">
        {image ? (
          <Image src={image} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-full border border-[var(--border)] object-cover" />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--brand-50)] text-[20px] font-[800] text-[var(--brand)]">
            <Initials name={name} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-[800] text-[var(--ink)]">{name || <span className="text-[var(--muted)]">{t.noNameSet}</span>}</p>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">{bio || t.noBioYet}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pr-btn-ghost shrink-0"
        >
          {t.editProfileBtn}
        </button>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={t.editEducatorProfile} size="sm">
        <EducatorProfileForm name={name} bio={bio} image={image} className="grid gap-4" />
      </Modal>
    </>
  );
}
