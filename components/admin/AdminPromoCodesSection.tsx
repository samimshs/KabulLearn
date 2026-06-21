"use client";

import { useRef, useState, useTransition } from "react";
import { createPromoCode, togglePromoCode, deletePromoCode } from "@/lib/actions/promo-actions";

type PromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | string | null;
  isActive: boolean;
  courseId: string | null;
  courseTitle?: string | null;
};

type PaidCourse = { id: string; title: string };

const fieldClass =
  "pr-input w-full";

const labelClass = "block text-[11px] font-[900] uppercase tracking-[1.2px] text-[var(--brand)] mb-1.5";

export function AdminPromoCodesSection({
  promoCodes,
  paidCourses
}: {
  promoCodes: PromoCode[];
  paidCourses: PaidCourse[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED_CENTS">("PERCENT");

  function handleCreate(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createPromoCode(formData);
      if (!result.ok) {
        setError(result.error ?? "Failed to create promo code.");
      } else {
        setSuccess(true);
        formRef.current?.reset();
        setDiscountType("PERCENT");
        setTimeout(() => setSuccess(false), 4000);
      }
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => { await togglePromoCode(id, isActive); });
  }

  function handleDelete(id: string, code: string) {
    if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    startTransition(async () => { await deletePromoCode(id); });
  }

  const activeCount = promoCodes.filter((p) => p.isActive).length;

  return (
    <div className="p-4 sm:p-5 lg:p-6">

      {/* ── Create form ────────────────────────────────────────────── */}
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <p className="mb-4 text-[11px] font-[900] uppercase tracking-[1.5px] text-[var(--brand)]">New promo code</p>

        <form ref={formRef} action={handleCreate}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Code */}
            <div>
              <label className={labelClass}>Code</label>
              <input
                name="code"
                required
                placeholder="e.g. SAVE20"
                autoComplete="off"
                className={fieldClass + " uppercase tracking-[2px]"}
                onChange={(e) => { e.target.value = e.target.value.toUpperCase().replace(/\s/g, ""); }}
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">Letters &amp; numbers only, no spaces</p>
            </div>

            {/* Discount type */}
            <div>
              <label className={labelClass}>Discount type</label>
              <select
                name="discountType"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED_CENTS")}
                className={fieldClass}
              >
                <option value="PERCENT">Percentage off (%)</option>
                <option value="FIXED_CENTS">Fixed amount (USD)</option>
              </select>
            </div>

            {/* Discount value */}
            <div>
              <label className={labelClass}>
                {discountType === "PERCENT" ? "Percent off (1–100)" : "Amount off (USD)"}
              </label>
              <input
                name="discountValue"
                type="number"
                required
                min={discountType === "PERCENT" ? 1 : 0.01}
                max={discountType === "PERCENT" ? 100 : undefined}
                step={discountType === "PERCENT" ? 1 : 0.01}
                placeholder={discountType === "PERCENT" ? "e.g. 20" : "e.g. 5.00"}
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {discountType === "PERCENT" ? "100 = completely free" : "Enter in dollars, e.g. 5.00"}
              </p>
            </div>

            {/* Max uses */}
            <div>
              <label className={labelClass}>Max uses</label>
              <input
                name="maxUses"
                type="number"
                min={1}
                step={1}
                placeholder="Unlimited"
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">Leave blank for unlimited</p>
            </div>

            {/* Expiry date */}
            <div>
              <label className={labelClass}>Expiry date</label>
              <input
                name="expiresAt"
                type="date"
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">Leave blank — no expiry</p>
            </div>

            {/* Course restriction */}
            <div>
              <label className={labelClass}>Restrict to course</label>
              <select name="courseId" className={fieldClass}>
                <option value="">All paid courses</option>
                {paidCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Optional — leave blank for all</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="pr-btn-primary disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/></svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Create promo code
                </>
              )}
            </button>
            {success ? (
              <span className="flex items-center gap-1.5 text-[13px] font-[800] text-[var(--success)]">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Promo code created
              </span>
            ) : null}
            {error ? (
              <span className="text-[13px] font-[800] text-[var(--danger)]">{error}</span>
            ) : null}
          </div>
        </form>
      </div>

      {/* ── Existing codes ──────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-[900] uppercase tracking-[1.5px] text-[var(--brand)]">
            Promo codes
          </p>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-[900] text-[var(--brand)]">
            {activeCount} active / {promoCodes.length} total
          </span>
        </div>

        {promoCodes.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--border)] py-10 text-center">
            <p className="text-[13px] font-[700] text-[var(--muted)]">No promo codes yet — create one above.</p>
          </div>
        ) : (
          <>
          <div className="hidden overflow-x-auto rounded-[14px] border border-[var(--border)] md:block">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  {["Code", "Discount", "Usage", "Expires", "Scope", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-[900] uppercase tracking-[1.2px] text-[var(--muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {promoCodes.map((p) => {
                  const expired = p.expiresAt ? new Date(p.expiresAt) < new Date() : false;
                  const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
                  const statusOk = p.isActive && !expired && !exhausted;
                  const statusLabel = !p.isActive ? "Disabled" : expired ? "Expired" : exhausted ? "Used up" : "Active";

                  return (
                    <tr key={p.id} className="bg-[var(--card)] transition hover:bg-[var(--surface)]">
                      <td className="px-4 py-3">
                        <span className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[12px] font-[900] tracking-[2px] text-[var(--ink)]">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-[800] text-[var(--ink)]">
                          {p.discountType === "PERCENT"
                            ? `${p.discountValue}% off`
                            : `$${(p.discountValue / 100).toFixed(2)} off`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--brand)]">
                        {p.usedCount}
                        {p.maxUses !== null ? (
                          <span className="text-[var(--muted)]"> / {p.maxUses}</span>
                        ) : (
                          <span className="text-[var(--muted)]"> / ∞</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--ink-2)]">
                        {p.expiresAt
                          ? new Date(p.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : <span className="text-[var(--muted)]">Never</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--ink-2)]">
                        {p.courseTitle
                          ? <span className="max-w-[160px] truncate block" title={p.courseTitle}>{p.courseTitle}</span>
                          : <span className="text-[var(--muted)]">All courses</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-[900] uppercase tracking-[1px] ${
                          statusOk
                            ? "bg-[var(--success-50)] text-[var(--success)]"
                            : "bg-[var(--danger-50)] text-[var(--danger)]"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusOk ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(p.id, !p.isActive)}
                            disabled={isPending}
                            className="text-[12px] font-[800] text-[var(--brand)] transition hover:text-[var(--ink)] disabled:opacity-40"
                          >
                            {p.isActive ? "Disable" : "Enable"}
                          </button>
                          <span className="text-[var(--border)]">|</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.code)}
                            disabled={isPending}
                            className="text-[12px] font-[800] text-[var(--danger)] transition hover:text-[var(--ink)] disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {promoCodes.map((p) => {
              const expired = p.expiresAt ? new Date(p.expiresAt) < new Date() : false;
              const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
              const statusOk = p.isActive && !expired && !exhausted;
              const statusLabel = !p.isActive ? "Disabled" : expired ? "Expired" : exhausted ? "Used up" : "Active";

              return (
                <article key={p.id} className="rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[12px] font-[900] tracking-[2px] text-[var(--ink)]">
                      {p.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-[900] uppercase tracking-[1px] ${
                      statusOk
                        ? "bg-[var(--success-50)] text-[var(--success)]"
                        : "bg-[var(--danger-50)] text-[var(--danger)]"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusOk ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} />
                      {statusLabel}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <dt className="font-[900] uppercase tracking-[1px] text-[var(--muted)]">Discount</dt>
                      <dd className="mt-0.5 font-[800] text-[var(--ink)]">
                        {p.discountType === "PERCENT" ? `${p.discountValue}% off` : `$${(p.discountValue / 100).toFixed(2)} off`}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-[900] uppercase tracking-[1px] text-[var(--muted)]">Usage</dt>
                      <dd className="mt-0.5 font-[800] text-[var(--brand)]">
                        {p.usedCount}<span className="text-[var(--muted)]"> / {p.maxUses !== null ? p.maxUses : "∞"}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-[900] uppercase tracking-[1px] text-[var(--muted)]">Expires</dt>
                      <dd className="mt-0.5 font-[700] text-[var(--ink-2)]">
                        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-[900] uppercase tracking-[1px] text-[var(--muted)]">Scope</dt>
                      <dd className="mt-0.5 line-clamp-2 font-[700] text-[var(--ink-2)]">{p.courseTitle ?? "All courses"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(p.id, !p.isActive)}
                      disabled={isPending}
                      className="min-h-9 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-[900] text-[var(--brand)] transition hover:bg-[var(--card)] disabled:opacity-40"
                    >
                      {p.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.code)}
                      disabled={isPending}
                      className="min-h-9 rounded-[var(--radius)] border border-[rgba(196,43,43,0.22)] bg-[var(--danger-50)] px-3 text-[12px] font-[900] text-[var(--danger)] transition hover:bg-[var(--card)] disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
