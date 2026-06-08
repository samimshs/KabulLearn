"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  getInbox,
  getConversation,
  sendDirectMessage,
  type ConversationSummary,
  type ConversationMessage
} from "@/lib/actions/message-actions";
import { setPortalUnreadCount } from "@/lib/portal-client-store";
import { useLanguage } from "@/components/LanguageProvider";

type ActivePartner = { userId: string; name: string; avatarUrl: string | null; role: string };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MessagesInbox() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialTo = searchParams.get("to");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialTo);
  const [partner, setPartner] = useState<ActivePartner | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [isSending, startSending] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load inbox list
  async function refreshInbox() {
    const list = await getInbox();
    setConversations(list);
    setPortalUnreadCount(list.reduce((sum, c) => sum + c.unread, 0));
  }

  useEffect(() => {
    refreshInbox();
  }, []);

  // Load the active conversation thread
  useEffect(() => {
    if (!activeId) {
      setPartner(null);
      setMessages([]);
      return;
    }
    setLoadingThread(true);
    getConversation({ otherUserId: activeId }).then((res) => {
      setPartner(res.partner);
      setMessages(res.messages);
      setLoadingThread(false);
      // Mark this conversation read locally + refresh badge
      setConversations((prev) => prev.map((c) => (c.userId === activeId ? { ...c, unread: 0 } : c)));
      getInbox().then((list) => setPortalUnreadCount(list.reduce((s, c) => s + c.unread, 0)));
    });
  }, [activeId]);

  // Auto-scroll to newest
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSend() {
    const body = draft.trim();
    if (!body || !activeId) return;
    startSending(async () => {
      const result = await sendDirectMessage({ recipientId: activeId, body });
      if (result.ok) {
        setMessages((prev) => [...prev, result.data]);
        setDraft("");
        refreshInbox();
      }
    });
  }

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[480px] grid-cols-1 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] md:grid-cols-[300px_1fr]">

      {/* Conversation list */}
      <aside className={`flex flex-col border-e border-[var(--border)] ${activeId ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-[15px] font-[800] text-[var(--ink)]">{t.conversations}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="grid place-content-center gap-1 p-8 text-center">
              <p className="text-[13px] font-[700] text-[var(--muted)]">{t.noConversationsYet}</p>
              <p className="text-[12px] text-[var(--muted-2)]">{t.messageInstructorToStart}</p>
            </div>
          ) : (
            conversations.map((c) => {
              const active = c.userId === activeId;
              return (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => setActiveId(c.userId)}
                  className={`flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-start transition ${
                    active ? "bg-[var(--brand-50)]" : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--brand-50)] text-[12px] font-[900] text-[var(--brand)]">
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(c.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-[800] text-[var(--ink)]">{c.name}</span>
                      <span className="shrink-0 text-[10px] font-[600] text-[var(--muted-2)]">{timeLabel(c.lastAt)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-[500] text-[var(--muted)]">{c.lastMessage}</span>
                      {c.unread > 0 && (
                        <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-[var(--brand)] px-1 text-[9px] font-[900] text-white">
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`flex flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {!partner ? (
          <div className="grid flex-1 place-content-center gap-2 p-8 text-center">
            <p className="text-[14px] font-[800] text-[var(--ink-2)]">{t.selectConversation}</p>
            <p className="text-[12px] text-[var(--muted)]">{t.chooseConversationHint}</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <button type="button" onClick={() => setActiveId(null)} className="md:hidden text-[var(--muted)]" aria-label="Back">
                ‹
              </button>
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--brand-50)] text-[11px] font-[900] text-[var(--brand)]">
                {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(partner.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-[800] text-[var(--ink)]">{partner.name}</p>
                <p className="text-[11px] font-[600] capitalize text-[var(--muted)]">{partner.role.toLowerCase()}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[var(--surface)] p-4">
              {loadingThread ? (
                <p className="text-center text-[12px] font-[600] text-[var(--muted)]">{t.loadingShort}</p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-[12px] font-[600] text-[var(--muted)]">
                  {t.noMessagesYet}
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-[14px] px-3.5 py-2 text-[13px] font-[500] leading-relaxed shadow-sm ${
                        m.mine
                          ? "rounded-br-sm bg-[var(--brand)] text-white"
                          : "rounded-bl-sm bg-white text-[var(--ink)] border border-[var(--border)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-[9px] font-[600] ${m.mine ? "text-white/70" : "text-[var(--muted-2)]"}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-[var(--border)] p-3">
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  rows={1}
                  placeholder={t.typeMessage}
                  className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] font-[500] text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSending || !draft.trim()}
                  className="pr-btn-primary !min-h-[42px] shrink-0 px-4 text-[13px] disabled:opacity-50"
                >
                  {isSending ? "…" : t.sendLabel}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
