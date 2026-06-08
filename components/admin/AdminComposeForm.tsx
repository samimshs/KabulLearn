"use client";

import { useState, useTransition } from "react";
import { adminSendMessage, adminBroadcast } from "@/lib/actions/admin-message-actions";

type User = { id: string; name: string | null; email: string; role: string };

export function AdminComposeForm({ users }: { users: User[] }) {
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
            className={`rounded-lg border px-3 py-1.5 text-xs font-[800] uppercase tracking-[1px] transition ${tab === t ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[rgba(0,87,255,0.3)]"}`}
          >
            {t === "direct" ? "Direct" : "Broadcast"}
          </button>
        ))}
      </div>

      {tab === "direct" ? (
        <select
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm font-[700] text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
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
              className={`rounded-lg border px-3 py-1.5 text-xs font-[800] uppercase tracking-[1px] transition ${broadcastRole === r ? "border-[var(--success)] bg-[var(--success-50)] text-[var(--success)]" : "border-[var(--border)] bg-white text-[var(--muted)]"}`}
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
        className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm font-[700] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:outline-none"
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
    </div>
  );
}
