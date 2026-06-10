"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { logout } from "@/lib/actions/auth-actions";
import { markAllNotificationsRead } from "@/lib/actions/notification-actions";
import { usePortalAvatarUrl, usePortalUnreadCount } from "@/lib/portal-client-store";
import type { MessagePreview, AppNotificationPreview } from "@/components/Header";
import { CommandPalette } from "@/components/CommandPalette";

type HeaderClientProps = {
  user: { name: string | null; role: string; image: string | null } | null;
  initialUnread?: number;
  messagePreviews?: MessagePreview[];
  appNotifications?: AppNotificationPreview[];
  unreadAppNotifications?: number;
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function SenderInitials({ name, role }: { name: string | null; role: string }) {
  const label = name ?? role;
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  const isAdmin = role === "ADMIN";
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-[900] text-white ${isAdmin ? "bg-[var(--danger)]" : "bg-[var(--brand)]"}`}>
      {initials}
    </span>
  );
}

export function HeaderClient({ user, initialUnread = 0, messagePreviews = [], appNotifications = [], unreadAppNotifications = 0 }: HeaderClientProps) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [appNotifUnread, setAppNotifUnread] = useState(unreadAppNotifications);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = usePortalUnreadCount(initialUnread);
  const avatarUrl = usePortalAvatarUrl(user?.image ?? null);
  const totalBellBadge = unreadCount + appNotifUnread;

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
        setMenuOpen(false);
        setNotifOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen && !notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, notifOpen]);

  const languageOptions = [
    { locale: "ps" as const, label: "پښتو", title: t.pashto },
    { locale: "fa" as const, label: "دری", title: t.dari },
    { locale: "en" as const, label: "EN", title: t.english }
  ];

  if (pathname === "/") return null;

  if (pathname === "/login" || pathname === "/register") {
    return (
      <header dir="ltr" className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-end gap-2 px-4 sm:px-5 lg:px-8">
          <Link href="/support" className="h-9 items-center rounded-[var(--radius)] px-3 text-[13px] font-[700] text-[var(--muted)] transition hover:text-[var(--brand)] inline-flex">
            {t.supportUs}
          </Link>
          <div className="flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm" role="group" aria-label={t.language}>
            {languageOptions.map((option) => (
              <button
                key={option.locale}
                type="button"
                title={option.title}
                onClick={() => setLocale(option.locale)}
                aria-pressed={locale === option.locale}
                className={`flex h-7 min-w-9 items-center justify-center rounded-full px-2.5 text-[12px] font-[900] transition ${
                  locale === option.locale
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>
    );
  }

  const initials = (user?.name ?? user?.role ?? "Student")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase()).join("") || "ST";

  const portalHref =
    user?.role === "ADMIN" ? "/admin" :
    user?.role === "EDUCATOR" ? "/educator" :
    "/dashboard";

  const portalLabel =
    user?.role === "ADMIN" ? "Admin panel" :
    user?.role === "EDUCATOR" ? "Educator portal" :
    t.myPortal;

  const inboxHref =
    user?.role === "EDUCATOR" ? "/educator/messages" :
    user?.role === "ADMIN" ? "/admin" :
    "/dashboard/messages";

  return (
    <>
    <header dir="ltr" className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-5 lg:px-8">

        {/* Wordmark */}
        <Link
          href="/"
          className="pr-focus flex h-11 shrink-0 items-center overflow-hidden"
          aria-label="KabulLearn home"
        >
          <img
            src="/poharana-logo-v3.svg"
            alt="KabulLearn"
            className="hidden h-11 w-[166px] max-w-[42vw] object-contain sm:block"
          />
          <img
            src="/poharana-icon-v3.svg"
            alt="KabulLearn"
            className="h-9 w-9 rounded-[10px] shadow-[0_8px_20px_rgba(0,87,255,0.18)] sm:hidden"
          />
        </Link>

        {/* Right side */}
        <div className="kl-header-actions flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-2">
          {user ? (
            <>
              {/* Search */}
              <button
                type="button"
                onClick={() => { setSearchOpen(true); setMenuOpen(false); setNotifOpen(false); }}
                aria-label="Search"
                className="flex h-9 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-[700] text-[var(--muted)] transition hover:border-[rgba(0,87,255,0.28)] hover:text-[var(--brand)]"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m10 10 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="hidden lg:block">Search</span>
                <kbd className="hidden rounded border border-[var(--border)] bg-white px-1 py-0.5 text-[10px] font-[800] text-[var(--muted-2)] lg:block">⌘K</kbd>
              </button>

              {/* Support link */}
              <Link href="/support" className="hidden h-9 items-center rounded-[var(--radius)] px-3 text-[13px] font-[700] text-[var(--muted)] transition hover:text-[var(--brand)] sm:inline-flex">
                {t.supportUs}
              </Link>

              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label={t.notificationsLabel}
                  aria-expanded={notifOpen}
                  onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
                  className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition hover:border-[rgba(0,87,255,0.28)] hover:text-[var(--brand)]"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M6 8a4 4 0 0 1 8 0c0 3 1.2 4.2 1.2 4.2H4.8S6 11 6 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.3 14.3a2 2 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {totalBellBadge > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-[900] leading-none text-white">
                      {totalBellBadge > 9 ? "9+" : totalBellBadge}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    role="dialog"
                    aria-label={t.notificationsLabel}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-white shadow-[0_8px_32px_rgba(10,9,20,0.12),0_2px_8px_rgba(10,9,20,0.06)]"
                  >
                    {/* Panel header */}
                    <div className="border-b border-[var(--border)] px-4 py-3">
                      <p className="text-[13px] font-[800] text-[var(--ink)]">{t.notificationsLabel}</p>
                    </div>

                    {/* Messages section */}
                    <div className="px-4 pt-3 pb-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-[800] uppercase tracking-wide text-[var(--muted)]">
                          {t.messagesTitle}
                        </span>
                        {unreadCount > 0 && (
                          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-[900] leading-none text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>

                      {messagePreviews.length > 0 ? (
                        <ul className="grid gap-1">
                          {messagePreviews.map((msg) => (
                            <li key={msg.senderId}>
                              <Link
                                href={inboxHref}
                                onClick={() => setNotifOpen(false)}
                                className="flex items-start gap-2.5 rounded-[10px] p-2 transition hover:bg-[var(--surface)]"
                              >
                                <SenderInitials name={msg.senderName} role={msg.senderRole} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-1">
                                    <span className="truncate text-[12px] font-[800] text-[var(--ink)]">
                                      {msg.senderName ?? msg.senderRole.toLowerCase()}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-[600] text-[var(--muted)]">
                                      {timeAgo(msg.createdAt)}
                                    </span>
                                  </div>
                                  <p className="line-clamp-1 text-[11px] font-[500] text-[var(--muted)]">
                                    {msg.snippet}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="py-2 text-[12px] text-[var(--muted)]">{t.noNewMessages}</p>
                      )}

                      <Link
                        href={inboxHref}
                        onClick={() => setNotifOpen(false)}
                        className="mt-2 mb-1 block text-[12px] font-[800] text-[var(--brand)] hover:underline underline-offset-2"
                      >
                        {t.seeAllMessages} →
                      </Link>
                    </div>

                    <div className="mx-4 border-t border-[var(--border)]" />

                    {/* App notifications */}
                    <div className="px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-[800] uppercase tracking-wide text-[var(--muted)]">
                          {t.notificationCenter}
                        </span>
                        {appNotifUnread > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              await markAllNotificationsRead();
                              setAppNotifUnread(0);
                            }}
                            className="text-[11px] font-[700] text-[var(--brand)] hover:underline"
                          >
                            {t.markAllRead}
                          </button>
                        )}
                      </div>
                      {appNotifications.length > 0 ? (
                        <ul className="grid gap-1 max-h-[200px] overflow-y-auto">
                          {appNotifications.map((notif) => (
                            <li key={notif.id}>
                              {notif.link ? (
                                <Link
                                  href={notif.link}
                                  onClick={() => setNotifOpen(false)}
                                  className="block rounded-[10px] p-2 transition hover:bg-[var(--surface)]"
                                >
                                  <p className="text-[12px] font-[800] text-[var(--ink)]">{notif.title}</p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted)]">{notif.body}</p>
                                  <p className="mt-1 text-[10px] font-[600] text-[var(--muted-2)]">{timeAgo(notif.createdAt)}</p>
                                </Link>
                              ) : (
                                <div className="rounded-[10px] p-2">
                                  <p className="text-[12px] font-[800] text-[var(--ink)]">{notif.title}</p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted)]">{notif.body}</p>
                                  <p className="mt-1 text-[10px] font-[600] text-[var(--muted-2)]">{timeAgo(notif.createdAt)}</p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="py-2 text-[12px] text-[var(--muted)]">{t.noNotifications}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar → dropdown menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false); }}
                  className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--brand)] text-xs font-[900] text-white shadow-[0_10px_24px_rgba(0,87,255,0.22)] transition hover:ring-2 hover:ring-[var(--brand)] hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                >
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={user.name ?? ""} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    : initials}
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-white shadow-[0_8px_32px_rgba(10,9,20,0.12),0_2px_8px_rgba(10,9,20,0.06)]"
                  >
                    {/* User info */}
                    <div className="border-b border-[var(--border)] px-4 py-3">
                      <p className="truncate text-[13px] font-[800] text-[var(--ink)]">
                        {user.name ?? user.role.toLowerCase()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-[600] capitalize text-[var(--muted)]">
                        {user.role.toLowerCase()}
                      </p>
                    </div>

                    {/* Portal link */}
                    <Link
                      href={portalHref}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[13px] font-[700] text-[var(--ink)] transition hover:bg-[var(--surface)]"
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4 text-[var(--brand)]" fill="none" aria-hidden="true">
                        <path d="M3 5.5 10 2l7 3.5v9A2 2 0 0 1 15 16.5H5A2 2 0 0 1 3 14.5v-9Z M7.5 16.5v-5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      {portalLabel}
                    </Link>

                    <div className="mx-4 border-t border-[var(--border)]" />

                    {/* Sign out */}
                    <form action={logout}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-[700] text-[var(--danger)] transition hover:bg-[rgba(220,38,38,0.04)]"
                      >
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                          <path d="M13 13.5 16.5 10 13 6.5M16.5 10H7.5M7.5 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t.signOut}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login?callbackUrl=%2Feducator" className="hidden h-9 items-center rounded-[var(--radius)] px-4 text-[13px] font-[700] text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline-flex">
                {t.educatorPortal}
              </Link>
              <Link href="/support" className="hidden h-9 items-center rounded-[var(--radius)] px-3 text-[13px] font-[700] text-[var(--muted)] transition hover:text-[var(--brand)] sm:inline-flex">
                {t.supportUs}
              </Link>
              <Link href="/login" className="pr-btn-ghost !min-h-9 px-4">
                {t.signIn}
              </Link>
              <Link href="/register" className="pr-btn-primary hidden !min-h-9 px-4 sm:inline-flex">
                {t.registerFree}
              </Link>
            </>
          )}

          {/* Language toggle */}
          <div className="flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm" role="group" aria-label={t.language}>
            {languageOptions.map((option) => (
              <button
                key={option.locale}
                type="button"
                title={option.title}
                onClick={() => setLocale(option.locale)}
                aria-pressed={locale === option.locale}
                className={`flex h-7 min-w-9 items-center justify-center rounded-full px-2.5 text-[12px] font-[900] transition ${
                  locale === option.locale
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
    <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
