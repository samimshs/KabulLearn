"use client";

import { useState, useTransition } from "react";
import { deleteModule } from "@/lib/actions/course-actions";

export function DeleteModuleButton({ moduleId }: { moduleId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            const result = await deleteModule({ moduleId });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage("Module removed.");
          })
        }
        disabled={isPending}
        className="pr-btn-ghost !min-h-10 px-3 text-xs uppercase tracking-[1px] text-[var(--muted)]"
      >
        {isPending ? "Removing..." : "Remove module"}
      </button>
      {message ? <p className="text-xs font-[700] text-[var(--danger)]">{message}</p> : null}
    </div>
  );
}
