"use client";

import { useEffect, useRef, useState } from "react";

// ── Timing ────────────────────────────────────────────────────────────────
const CHAR_TYPE_MS   = 40;    // ms per character typed
const CHAR_ERASE_MS  = 18;    // ms per character erased (faster feels natural)
const PAUSE_TYPED    = 5000;  // ms to hold the fully-typed statement
const PAUSE_ERASED   = 300;   // ms gap between erase finishing and next think phase

// ── Thinking effect ───────────────────────────────────────────────────────
// Glyphs used during the scramble phase — language-neutral noise characters
// that suggest computation without referencing a specific script.
const THINK_GLYPHS = "abcdefghijklmnopqrstuvwxyz·∷—.,:;";
const THINK_FRAMES    = 10;   // number of scramble frames
const THINK_FRAME_MS  = 50;   // ms between each frame

function randomThinkStr(): string {
  const chunks = 2 + Math.floor(Math.random() * 2); // 2–3 word-like chunks
  return Array.from({ length: chunks }, () => {
    const len = 3 + Math.floor(Math.random() * 6);  // 3–8 chars per chunk
    return Array.from({ length: len }, () =>
      THINK_GLYPHS[Math.floor(Math.random() * THINK_GLYPHS.length)],
    ).join("");
  }).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────
export function HeroSubtextRotator({ statements }: { statements: string[] }) {
  const longest = statements.reduce(
    (a, b) => (b.length > a.length ? b : a),
    statements[0] ?? "",
  );

  // Initialised to the first statement so SSR and hydration produce the same
  // HTML — no mismatch, no flicker.
  const [display, setDisplay] = useState(statements[0] ?? "");
  // Only updates once a full statement is typed — prevents screen readers from
  // hearing every single character added or removed.
  const [srText,  setSrText]  = useState(statements[0] ?? "");
  // Starts false so no cursor is ever injected into the server-rendered HTML.
  const [animate, setAnimate] = useState(false);
  // Drives the fat-block vs thin-blinker cursor shape. Set true when erasing /
  // scrambling / typing; false again when the statement is fully typed and held.
  const [cursorFat, setCursorFat] = useState(false);

  // All mutable animation state lives here — reads in setTimeout callbacks
  // always see the latest values without causing extra re-renders.
  const anim = useRef<{
    idx:        number;
    len:        number;
    thinkFrame: number;
    phase:      "paused" | "erasing" | "gapping" | "thinking" | "typing";
    tid:        ReturnType<typeof setTimeout> | null;
    isFat:      boolean;
  }>({
    idx:        0,
    len:        statements[0]?.length ?? 0,
    thinkFrame: 0,
    phase:      "paused",
    tid:        null,
    isFat:      false,
  });

  // ── State machine ────────────────────────────────────────────────────────
  useEffect(() => {
    if (statements.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    setAnimate(true);

    const r = anim.current;

    function step() {
      const stmt = statements[r.idx];

      switch (r.phase) {

        // Hold is over — fatten the cursor and start erasing.
        case "paused": {
          if (!r.isFat) { r.isFat = true; setCursorFat(true); }
          r.phase = "erasing";
          r.tid   = setTimeout(step, CHAR_ERASE_MS);
          break;
        }

        // Remove one character per tick until empty.
        case "erasing": {
          if (r.len > 0) {
            r.len--;
            setDisplay(stmt.slice(0, r.len));
            r.tid = setTimeout(step, CHAR_ERASE_MS);
          } else {
            r.phase = "gapping";
            r.tid   = setTimeout(step, PAUSE_ERASED);
          }
          break;
        }

        // Brief pause between erase and thinking scramble.
        case "gapping": {
          r.thinkFrame = 0;
          r.phase      = "thinking";
          r.tid        = setTimeout(step, THINK_FRAME_MS);
          break;
        }

        // Show rapidly-cycling random characters — the "thinking" phase.
        // Runs for THINK_FRAMES iterations before transitioning to typing.
        case "thinking": {
          if (r.thinkFrame < THINK_FRAMES) {
            r.thinkFrame++;
            setDisplay(randomThinkStr());
            r.tid = setTimeout(step, THINK_FRAME_MS);
          } else {
            // Scramble done — advance to the next statement and begin typing.
            r.idx   = (r.idx + 1) % statements.length;
            r.len   = 0;
            setDisplay("");
            r.phase = "typing";
            r.tid   = setTimeout(step, CHAR_TYPE_MS);
          }
          break;
        }

        // Add one character per tick until the statement is fully typed.
        case "typing": {
          const next = statements[r.idx];
          if (r.len < next.length) {
            r.len++;
            setDisplay(next.slice(0, r.len));
            r.tid = setTimeout(step, CHAR_TYPE_MS);
          } else {
            // Fully typed — slim cursor back to blinker, tell screen reader, hold.
            if (r.isFat) { r.isFat = false; setCursorFat(false); }
            setSrText(next);
            r.phase = "paused";
            r.tid   = setTimeout(step, PAUSE_TYPED);
          }
          break;
        }
      }
    }

    // The first statement is already visible — start by holding then cycling.
    r.phase = "paused";
    r.tid   = setTimeout(step, PAUSE_TYPED);

    return () => {
      if (r.tid) clearTimeout(r.tid);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // No JS cursor-blink timer — the CSS animation kl-cursor-blink handles it.

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <p className="pr-copy kl-home-subheadline kl-hero-rotator">
      {/*
        Invisible height anchor: always occupies the height of the longest
        statement so the paragraph never collapses or grows as text changes.
        visibility:hidden still takes up space; aria-hidden hides it from AT.
      */}
      <span aria-hidden="true" className="invisible">
        {longest}
      </span>

      <span aria-hidden="true" className="kl-hero-rotator-text">
        {display}
        {animate && (
          <span className={`kl-hero-cursor${cursorFat ? " is-fat" : ""}`} />
        )}
      </span>

      {/*
        Accessible live region: screen readers hear each complete statement
        once — not every individual character.
        aria-atomic="true" reads the whole sentence on change.
      */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {srText}
      </span>
    </p>
  );
}
