"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type Message = { role: "user" | "assistant"; content: string; chatLogId?: string; feedback?: 1 | -1 };

const URL_RE = /https?:\/\/[^\s)>\]"']+/g;

function linkify(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80 break-all"
      >
        {match[0]}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function CourseChatbox({ courseId }: { courseId?: string }) {
  const { t, direction, locale } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = locale === "ps"
    ? ["څنګه کورس پیل کړم؟", "څنګه استاد شم؟", "زما سند څنګه ترلاسه کړم؟"]
    : locale === "fa"
      ? ["چگونه یک کورس را شروع کنم؟", "چگونه استاد شوم؟", "چگونه سندم را دریافت کنم؟"]
      : ["How do I start a course?", "How do I become an educator?", "How do I get my certificate?"];

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t.chatWelcome }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    const activeCourseId = courseId ?? pathname.match(/^\/courses\/([^/]+)/)?.[1];

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, courseId: activeCourseId ? decodeURIComponent(activeCourseId) : undefined })
      });

      if (!res.ok || !res.body) throw new Error("Request failed");
      const chatLogId = res.headers.get("X-KabulLearn-Chat-Log-Id") ?? undefined;

      setMessages(prev => [...prev, { role: "assistant", content: "", chatLogId }]);

      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
            chatLogId: next[next.length - 1].chatLogId
          };
          return next;
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: t.chatError }]);
    } finally {
      setStreaming(false);
    }
  }

  async function sendFeedback(index: number, rating: 1 | -1) {
    const message = messages[index];
    if (!message?.chatLogId) return;
    setMessages(prev => prev.map((item, i) => i === index ? { ...item, feedback: rating } : item));
    await fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatLogId: message.chatLogId, rating })
    }).catch(() => {});
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={t.chatLabel}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-[0_8px_24px_rgba(0,87,255,0.35)] transition hover:scale-105 hover:shadow-[0_12px_32px_rgba(0,87,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
      >
        {open ? (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M3 5.5h14M3 10h10M3 14.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16" cy="14.5" r="2.5" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          dir={direction}
          className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_16px_48px_rgba(10,9,20,0.18),0_4px_16px_rgba(10,9,20,0.08)]"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--brand)] px-4 py-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white" fill="none" aria-hidden="true">
                <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2 14c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <span className="flex-1 text-[13px] font-[800] text-white">{t.chatLabel}</span>
            <button
              type="button"
              onClick={() => { setMessages([]); }}
              className="text-[11px] font-[700] text-white/70 transition hover:text-white"
            >
              {t.chatClear}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length <= 1 && (
              <div className="grid gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-start text-[12px] font-[700] text-[var(--ink-2)] transition hover:border-[rgba(0,87,255,0.3)] hover:text-[var(--brand)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="grid max-w-[85%] gap-1">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--brand)] text-white rounded-br-sm"
                        : "bg-[var(--surface)] text-[var(--ink)] rounded-bl-sm border border-[var(--border)]"
                    }`}
                  >
                    {msg.content
                      ? (msg.role === "assistant" ? linkify(msg.content) : msg.content)
                      : (
                      <span className="flex gap-1 items-center text-[var(--muted)]">
                        <span className="animate-bounce [animation-delay:0ms]">·</span>
                        <span className="animate-bounce [animation-delay:150ms]">·</span>
                        <span className="animate-bounce [animation-delay:300ms]">·</span>
                      </span>
                    )}
                  </div>
                  {msg.role === "assistant" && msg.chatLogId && msg.content ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => sendFeedback(i, 1)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-[800] ${msg.feedback === 1 ? "bg-[var(--success-50)] text-[var(--success)]" : "text-[var(--muted)] hover:bg-[var(--surface)]"}`}
                        aria-label="Helpful answer"
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => sendFeedback(i, -1)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-[800] ${msg.feedback === -1 ? "bg-[var(--danger-50)] text-[var(--danger)]" : "text-[var(--muted)] hover:bg-[var(--surface)]"}`}
                        aria-label="Unhelpful answer"
                      >
                        Needs work
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-end gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)] transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.chatPlaceholder}
                disabled={streaming}
                rows={1}
                dir={direction}
                className="flex-1 resize-none bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:outline-none disabled:opacity-50"
                style={{ maxHeight: 96, overflowY: "auto" }}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t.chatSend}
              >
                {streaming ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path d="M13.5 8H2.5M8.5 3L13.5 8l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-[var(--muted-2)]">
              AI · {t.chatLabel}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
