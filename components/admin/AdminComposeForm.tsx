"use client";

import { useState, useTransition } from "react";
import { adminSendMessage, adminBroadcast } from "@/lib/actions/admin-message-actions";

type User = { id: string; name: string | null; email: string; role: string };
export type AdminMessageHistoryItem = {
  id: string;
  body: string;
  createdAt: string;
  recipientCount: number;
  recipients: string[];
};

export function AdminComposeForm({ users, history = [] }: { users: User[]; history?: AdminMessageHistoryItem[] }) {
  const [tab, setTab] = useState<"direct" | "broadcast">("direct");
  const [recipientId, setRecipientId] = useState("");
  const [broadcastRole, setBroadcastRole] = useState<"STUDENT" | "EDUCATOR">("EDUCATOR");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function send() {
    if (!body.trim()) return;
    setStatus("");
    startTransition(async () => {
      if (tab === "direct") {
        if (!recipientId) { setStatus("Select a recipient."); return; }
        const result = await adminSendMessage({ recipientId, body });
        if (result.ok) { setBody(""); setStatus("Message sent."); }
        else setStatus(result.error);
      } else {
        const result = await adminBroadcast({ role: broadcastRole as "STUDENT" | "EDUCATOR", body });
        if (result.ok) {
          setBody("");
          setStatus(result.data.count === 0
            ? "No users in that group."
            : `Sent to ${result.data.count} ${broadcastRole.toLowerCase()}${result.data.count !== 1 ? "s" : ""}.`);
        } else setStatus(result.error);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        {(["direct", "broadcast"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setStatus(""); }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-[800] uppercase tracking-[1px] transition ${tab === t ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[rgba(0,87,255,0.3)]"}`}
          >
            {t === "direct" ? "Direct" : "Broadcast"}
          </button>
        ))}
      </div>

      {tab === "direct" ? (
        <select
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-[700] text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
        >
          <option value="">— Select recipient —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email} ({u.role.toLowerCase()})
            </option>
          ))}
        </select>
      ) : (
        <div className="flex gap-2">
          {(["EDUCATOR", "STUDENT"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setBroadcastRole(r)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-[800] uppercase tracking-[1px] transition ${broadcastRole === r ? "border-[var(--success)] bg-[var(--success-50)] text-[var(--success)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"}`}
            >
              All {r.toLowerCase()}s
            </button>
          ))}
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Write your message…"
        className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-[700] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:outline-none"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={isPending || !body.trim()}
          className="rounded-[var(--radius)] bg-[var(--brand)] px-4 py-2 text-sm font-[800] text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send message"}
        </button>
        {status && <p className="text-sm font-[700] text-[var(--muted)]">{status}</p>}
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-[900] uppercase tracking-[1px] text-[var(--muted)]">Sent history</p>
            <p className="mt-1 text-xs font-[600] text-[var(--muted)]">Recent messages and broadcasts sent by admins.</p>
          </div>
        </div>
        {history.length > 0 ? (
          <div className="grid gap-2">
            {history.map((item) => (
              <article key={item.id} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-[800] text-[var(--ink)]">
                    {item.recipientCount > 1 ? `Broadcast to ${item.recipientCount} users` : `To ${item.recipients[0] ?? "user"}`}
                  </p>
                  <time className="text-[11px] font-[700] text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </time>
                </div>
                {item.recipientCount > 1 ? (
                  <p className="mt-1 text-[11px] font-[600] text-[var(--muted)]">
                    {item.recipients.slice(0, 4).join(", ")}{item.recipientCount > 4 ? ` +${item.recipientCount - 4} more` : ""}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm font-[600] leading-6 text-[var(--ink-2)]">{item.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-[700] text-[var(--muted)]">
            No sent messages yet.
          </p>
        )}
      </div>
    </div>
  );
}
