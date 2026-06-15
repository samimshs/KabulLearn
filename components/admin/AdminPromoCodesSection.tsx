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
  "h-10 w-full rounded-[10px] border border-[#26364f] bg-[#0b182b] px-3 text-[13px] font-[600] text-white placeholder:text-[#4a5e7a] focus:border-[#3b82f6] focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition";

const labelClass = "block text-[11px] font-[900] uppercase tracking-[1.2px] text-[#7ea7ff] mb-1.5";

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
    <div className="p-5 lg:p-6">

      {/* ── Create form ────────────────────────────────────────────── */}
      <div className="rounded-[14px] border border-[#1f2a3d] bg-[#07111f] p-5">
        <p className="mb-4 text-[11px] font-[900] uppercase tracking-[1.5px] text-[#7ea7ff]">New promo code</p>

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
              <p className="mt-1 text-[11px] text-[#4a5e7a]">Letters & numbers only, no spaces</p>
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
              <p className="mt-1 text-[11px] text-[#4a5e7a]">
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
              <p className="mt-1 text-[11px] text-[#4a5e7a]">Leave blank for unlimited</p>
            </div>

            {/* Expiry date */}
            <div>
              <label className={labelClass}>Expiry date</label>
              <input
                name="expiresAt"
                type="date"
                className={fieldClass + " [color-scheme:dark]"}
              />
              <p className="mt-1 text-[11px] text-[#4a5e7a]">Leave blank — no expiry</p>
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
              <p className="mt-1 text-[11px] text-[#4a5e7a]">Optional — leave blank for all</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#3b82f6] bg-[#3b82f6] px-5 text-[13px] font-[800] text-white shadow-[0_6px_18px_rgba(59,130,246,0.28)] transition hover:border-[#2563eb] hover:bg-[#2563eb] disabled:opacity-50"
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
              <span className="flex items-center gap-1.5 text-[13px] font-[800] text-[#34d399]">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Promo code created
              </span>
            ) : null}
            {error ? (
              <span className="text-[13px] font-[800] text-[#f87171]">{error}</span>
            ) : null}
          </div>
        </form>
      </div>

      {/* ── Existing codes ──────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-[900] uppercase tracking-[1.5px] text-[#8fb5ff]">
            Promo codes
          </p>
          <span className="rounded-full border border-[#26364f] bg-[#0b182b] px-2.5 py-0.5 text-[11px] font-[900] text-[#8fb5ff]">
            {activeCount} active / {promoCodes.length} total
          </span>
        </div>

        {promoCodes.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#26364f] py-10 text-center">
            <p className="text-[13px] font-[700] text-[#4a5e7a]">No promo codes yet — create one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[14px] border border-[#1f2a3d]">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#1f2a3d] bg-[#07111f]">
                  {["Code", "Discount", "Usage", "Expires", "Scope", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-[900] uppercase tracking-[1.2px] text-[#4a5e7a]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2a3d]">
                {promoCodes.map((p) => {
                  const expired = p.expiresAt ? new Date(p.expiresAt) < new Date() : false;
                  const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
                  const statusOk = p.isActive && !expired && !exhausted;
                  const statusLabel = !p.isActive ? "Disabled" : expired ? "Expired" : exhausted ? "Used up" : "Active";

                  return (
                    <tr key={p.id} className="bg-[#0b182b] transition hover:bg-[#0f1f33]">
                      <td className="px-4 py-3">
                        <span className="rounded-[6px] border border-[#26364f] bg-[#07111f] px-2 py-1 font-mono text-[12px] font-[900] tracking-[2px] text-white">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-[800] text-white">
                          {p.discountType === "PERCENT"
                            ? `${p.discountValue}% off`
                            : `$${(p.discountValue / 100).toFixed(2)} off`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#8fb5ff]">
                        {p.usedCount}
                        {p.maxUses !== null ? (
                          <span className="text-[#4a5e7a]"> / {p.maxUses}</span>
                        ) : (
                          <span className="text-[#4a5e7a]"> / ∞</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#8fb5ff]">
                        {p.expiresAt
                          ? new Date(p.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : <span className="text-[#4a5e7a]">Never</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#8fb5ff]">
                        {p.courseTitle
                          ? <span className="max-w-[160px] truncate block" title={p.courseTitle}>{p.courseTitle}</span>
                          : <span className="text-[#4a5e7a]">All courses</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-[900] uppercase tracking-[1px] ${
                          statusOk
                            ? "bg-[rgba(52,211,153,0.12)] text-[#34d399]"
                            : "bg-[rgba(248,113,113,0.12)] text-[#f87171]"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusOk ? "bg-[#34d399]" : "bg-[#f87171]"}`} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(p.id, !p.isActive)}
                            disabled={isPending}
                            className="text-[12px] font-[800] text-[#8fb5ff] transition hover:text-white disabled:opacity-40"
                          >
                            {p.isActive ? "Disable" : "Enable"}
                          </button>
                          <span className="text-[#26364f]">|</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.code)}
                            disabled={isPending}
                            className="text-[12px] font-[800] text-[#f87171] transition hover:text-white disabled:opacity-40"
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
        )}
      </div>
    </div>
  );
}
