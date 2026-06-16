"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
type ToastEntry = { id: number; message: string; kind: ToastKind };
type ToastFn = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const toast = useCallback<ToastFn>((message, kind = "success") => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 end-5 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            style={{ animation: "kl-toast-in 0.18s ease-out" }}
            className={[
              "pointer-events-auto flex items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3 shadow-[var(--shadow-lg)] text-[13px] font-[800]",
              t.kind === "success" && "border-[var(--success)] bg-[var(--success-50)] text-[var(--success)]",
              t.kind === "error"   && "border-[var(--danger)]  bg-[var(--danger-50)]  text-[var(--danger)]",
              t.kind === "info"    && "border-[var(--border)]  bg-[var(--card)]        text-[var(--ink)]",
            ].filter(Boolean).join(" ")}
          >
            {t.kind === "success" && (
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="m5 8 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {t.kind === "error" && (
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {t.kind === "info" && (
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 7v4M8 5.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
