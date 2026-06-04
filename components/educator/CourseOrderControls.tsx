"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderLessons, reorderModules } from "@/lib/actions/course-actions";

type OrderItem = {
  id: string;
  label: string;
  meta?: string;
};

type OrderListProps = {
  items: OrderItem[];
  emptyText: string;
  saveLabel: string;
  onSave: (ids: string[]) => Promise<{ ok: true; data: void } | { ok: false; error: string }>;
};

function moveItem(items: OrderItem[], draggedId: string, targetId: string) {
  const from = items.findIndex((item) => item.id === draggedId);
  const to = items.findIndex((item) => item.id === targetId);

  if (from === -1 || to === -1 || from === to) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function OrderList({ items, emptyText, saveLabel, onSave }: OrderListProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const originalIds = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const orderedIds = orderedItems.map((item) => item.id).join("|");
  const hasChanges = originalIds !== orderedIds;

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  if (items.length === 0) {
    return <p className="text-sm font-[700] text-[var(--muted)]">{emptyText}</p>;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => {
              setDraggedId(item.id);
              setMessage("");
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!draggedId) return;
              setOrderedItems((current) => moveItem(current, draggedId, item.id));
              setDraggedId(null);
            }}
            className={`grid cursor-grab grid-cols-[auto_1fr] items-center gap-3 rounded-[var(--radius)] border bg-white px-3 py-3 text-left shadow-sm transition active:cursor-grabbing ${
              draggedId === item.id ? "border-[var(--brand)] opacity-60" : "border-[var(--border)] hover:border-[rgba(15,118,110,0.35)]"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-[900] text-[var(--brand)]">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-[850] text-[var(--ink)]">{item.label}</span>
              {item.meta ? <span className="mt-1 block text-xs font-[700] text-[var(--muted)]">{item.meta}</span> : null}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!hasChanges || isPending}
          onClick={() =>
            startTransition(async () => {
              setMessage("");
              const result = await onSave(orderedItems.map((item) => item.id));
              if (result.ok) {
                setMessage("Order saved. Submit the course again when ready.");
                router.refresh();
              } else {
                setMessage(result.error);
              }
            })
          }
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-xs font-[900] text-white transition hover:bg-[var(--brand-2)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : saveLabel}
        </button>
        {message ? <p className="text-xs font-[800] text-[var(--muted)]">{message}</p> : null}
      </div>
    </div>
  );
}

export function ModuleOrderControl({ courseId, modules }: { courseId: string; modules: OrderItem[] }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3">
        <p className="pr-eyebrow">Drag order</p>
        <h3 className="mt-1 text-base font-[850] text-[var(--ink)]">Modules</h3>
      </div>
      <OrderList
        items={modules}
        emptyText="Add modules before ordering."
        saveLabel="Save module order"
        onSave={(moduleIds) => reorderModules({ courseId, moduleIds })}
      />
    </div>
  );
}

export function LessonOrderControl({ moduleId, lessons }: { moduleId: string; lessons: OrderItem[] }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-white p-3">
      <div className="mb-3">
        <p className="text-xs font-[900] uppercase tracking-[1.2px] text-[var(--brand)]">Drag order</p>
        <h4 className="mt-1 text-sm font-[850] text-[var(--ink)]">Lessons</h4>
      </div>
      <OrderList
        items={lessons}
        emptyText="Add lessons before ordering."
        saveLabel="Save lesson order"
        onSave={(lessonIds) => reorderLessons({ moduleId, lessonIds })}
      />
    </div>
  );
}
