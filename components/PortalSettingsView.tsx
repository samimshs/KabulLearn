"use client";

import { useState, useTransition } from "react";
import {
  changeLearnerPassword,
  exportLearnerData,
  logOutAllDatabaseSessions,
  requestAccountDeletion,
  updateLearnerProfile
} from "@/lib/actions/portal-settings-actions";
import { setPortalAvatarUrl } from "@/lib/portal-client-store";
import { useLanguage } from "@/components/LanguageProvider";

type SessionRow = {
  id: string;
  label: string;
  expires: string;
  current?: boolean;
};

type PortalSettingsViewProps = {
  profile: {
    name: string;
    email: string;
    bio: string;
    image: string | null;
    linkedinUrl: string | null;
  };
  sessions: SessionRow[];
};

export function PortalSettingsView({ profile, sessions }: PortalSettingsViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "data">("profile");
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [image, setImage] = useState(profile.image);
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl ?? "");
  const [profileStatus, setProfileStatus] = useState("");
  const [securityStatus, setSecurityStatus] = useState("");
  const [dataStatus, setDataStatus] = useState("");
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function saveProfile() {
    setProfileStatus("");
    startTransition(async () => {
      const result = await updateLearnerProfile({ name, bio, image: image || undefined, linkedinUrl: linkedinUrl || undefined });
      if (result.ok) {
        setPortalAvatarUrl(result.data.image);
        setProfileStatus(t.profileSaved);
      } else {
        setProfileStatus(result.error);
      }
    });
  }

  async function uploadAvatar(file: File) {
    setProfileStatus(t.uploadingAvatar);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload/avatar", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      setProfileStatus(payload.error ?? t.avatarUploadFailed);
      return;
    }
    setImage(payload.url);
    setPortalAvatarUrl(payload.url);
    setProfileStatus(t.avatarUploadedMsg);
  }

  function changePassword(formData: FormData) {
    setSecurityStatus("");
    startTransition(async () => {
      const result = await changeLearnerPassword({
        currentPassword: String(formData.get("currentPassword") || ""),
        newPassword: String(formData.get("newPassword") || ""),
        confirmPassword: String(formData.get("confirmPassword") || "")
      });
      setSecurityStatus(result.ok ? t.passwordUpdatedMsg : result.error);
    });
  }

  function clearSessions() {
    setSecurityStatus("");
    startTransition(async () => {
      const result = await logOutAllDatabaseSessions();
      setSecurityStatus(
        result.ok ? t.sessionsCleared : result.error
      );
    });
  }

  function downloadData() {
    setDataStatus("");
    startTransition(async () => {
      const result = await exportLearnerData();
      if (!result.ok) {
        setDataStatus(result.error);
        return;
      }
      const blob = new Blob([result.data.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.data.filename;
      link.click();
      URL.revokeObjectURL(url);
      setDataStatus(t.dataExportPrepared);
    });
  }

  function requestDeletion() {
    setDataStatus("");
    startTransition(async () => {
      const result = await requestAccountDeletion();
      setDataStatus(
        result.ok ? t.accountDeletionNoted : result.error
      );
    });
  }

  return (
    <section className="portal-settings">
      <div className="pr-panel p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="pr-eyebrow">{t.settingsTitle}</p>
            <h1 className="pr-h2 mt-1">{t.accountSettingsHeading}</h1>
            <p className="pr-copy mt-2 max-w-2xl">{t.manageProfileHint}</p>
          </div>
          <div className="portal-settings-tabs" role="tablist" aria-label={t.settingsTitle}>
            {[
              ["profile", t.settingsProfileTab],
              ["security", t.settingsSecurityTab],
              ["data", t.settingsDataTab]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={activeTab === key ? "is-active" : ""}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "profile" ? (
        <section className="pr-panel portal-settings-section">
          <div>
            <p className="pr-eyebrow">{t.profileManagement}</p>
            <h2 className="mt-2 text-2xl font-[900] text-[var(--ink)]">{t.publicLearnerProfile}</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="grid justify-items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface)] p-5 text-center">
              <button
                type="button"
                onClick={() => { if (image) setAvatarViewerOpen(true); }}
                aria-label={t.viewLabel}
                className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[var(--brand)] text-2xl font-[900] text-white shadow-[var(--shadow)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.2)]"
              >
                {image ? (
                  <img src={image} alt="" className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <span>{name.slice(0, 2).toUpperCase()}</span>
                )}
                {image ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" aria-hidden="true">
                      <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </span>
                ) : null}
              </button>

              {/* View / Edit — directly below the picture */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={!image}
                  onClick={() => { if (image) setAvatarViewerOpen(true); }}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-[800] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.28)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                  {t.viewLabel}
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-[800] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.28)] hover:text-[var(--brand)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M8.5 7.5 10 5h4l1.5 2.5H19A2 2 0 0 1 21 9.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2h3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                  {t.editLabel}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadAvatar(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="text-xs font-[700] text-[var(--muted)]">{t.imageFormatsHint}</p>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
                {t.displayNameLabel}
                <input className="pr-input" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <div className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
                {t.emailLabel}
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-[700] text-[var(--muted)]">
                  {profile.email}
                </div>
                <p className="text-xs font-[700] text-[var(--muted)]">
                  {t.emailLockedHint}
                </p>
              </div>
              <label className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
                {t.bioLabel}
                <textarea className="pr-input min-h-32" value={bio} onChange={(event) => setBio(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-[800] text-[var(--ink)]">
                {t.linkedinUrlLabel}
                <input
                  className="pr-input"
                  type="url"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={linkedinUrl}
                  onChange={(event) => setLinkedinUrl(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={saveProfile} disabled={isPending} className="pr-btn-primary">
                  {t.saveProfileLabel}
                </button>
                {profileStatus ? <p className="text-sm font-[800] text-[var(--muted)]">{profileStatus}</p> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "security" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <form action={changePassword} className="pr-panel portal-settings-section">
            <div>
              <p className="pr-eyebrow">{t.settingsSecurityTab}</p>
              <h2 className="mt-2 text-2xl font-[900] text-[var(--ink)]">{t.changePassword}</h2>
            </div>
            <input name="currentPassword" type="password" autoComplete="current-password" required className="pr-input" placeholder={t.currentPasswordLabel} />
            <input name="newPassword" type="password" autoComplete="new-password" required minLength={8} className="pr-input" placeholder={t.newPasswordLabel} />
            <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} className="pr-input" placeholder={t.confirmPasswordLabel} />
            <button type="submit" disabled={isPending} className="pr-btn-primary">{t.updatePassword}</button>
            {securityStatus ? <p className="text-sm font-[800] text-[var(--muted)]">{securityStatus}</p> : null}
          </form>

          <section className="pr-panel portal-settings-section">
            <div>
              <p className="pr-eyebrow">{t.sessionManagement}</p>
              <h2 className="mt-2 text-2xl font-[900] text-[var(--ink)]">{t.activeDeviceLogins}</h2>
            </div>
            <div className="grid gap-3">
              {sessions.map((session) => (
                <article key={session.id} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div>
                    <p className="font-[900] text-[var(--ink)]">{session.label}</p>
                    <p className="mt-1 text-xs font-[700] text-[var(--muted)]">{t.expiresLabel} {session.expires}</p>
                  </div>
                  {session.current ? <span className="pr-badge pr-badge-green">{t.currentLabel}</span> : null}
                </article>
              ))}
            </div>
            <button type="button" onClick={clearSessions} disabled={isPending} className="pr-btn-danger">
              {t.logoutAllDevices}
            </button>
          </section>
        </section>
      ) : null}

      {activeTab === "data" ? (
        <section className="pr-panel portal-settings-section">
          <div>
            <p className="pr-eyebrow">{t.securityAndData}</p>
            <h2 className="mt-2 text-2xl font-[900] text-[var(--ink)]">{t.dataCompliance}</h2>
            <p className="pr-copy mt-2">{t.dataComplianceHint}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={downloadData} disabled={isPending} className="pr-btn-ghost">
              {t.downloadMyData}
            </button>
            <button type="button" onClick={requestDeletion} disabled={isPending} className="pr-btn-danger">
              {t.requestAccountDeletionBtn}
            </button>
          </div>
          {dataStatus ? <p className="rounded-[var(--radius)] bg-[var(--surface)] p-4 text-sm font-[800] text-[var(--muted)]">{dataStatus}</p> : null}
        </section>
      ) : null}

      {avatarViewerOpen && image ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t.profilePicturePreview}>
          <div className="relative max-w-[min(90vw,520px)] rounded-[var(--radius-xl)] border border-white/20 bg-white p-4 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => setAvatarViewerOpen(false)}
              className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,87,255,0.2)]"
              aria-label={t.closePreview}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <img src={image} alt={t.profilePicturePreview} className="max-h-[72vh] w-full rounded-[var(--radius-lg)] object-contain" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
