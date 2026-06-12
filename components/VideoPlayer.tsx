"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { completeEmbeddedVideoLesson } from "@/lib/actions/video-actions";
import { useLanguage } from "@/components/LanguageProvider";

const WATCH_UNLOCK_SECONDS = 60;
// Save position every N seconds while playing
const SAVE_INTERVAL_SECONDS = 5;

type YTPlayer = {
  getPlayerState(): number;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
};

type YTWindow = typeof window & {
  YT?: {
    Player: new (el: string | HTMLElement, opts: object) => YTPlayer;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; UNSTARTED: number };
  };
  onYouTubeIframeAPIReady?: () => void;
};

// Module-level promise so all VideoPlayer instances share one load
let ytReady: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ytReady) return ytReady;
  ytReady = new Promise<void>((resolve) => {
    const win = window as YTWindow;
    if (win.YT?.Player) { resolve(); return; }
    const prev = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => { resolve(); prev?.(); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytReady;
}

function getYouTubeId(value: string) {
  const raw = value.trim();
  if (!raw.includes("youtube.com") && !raw.includes("youtube-nocookie.com") && !raw.includes("youtu.be")) {
    return raw;
  }
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] ?? raw;
    }
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => ["embed", "shorts", "live", "v"].includes(part));
    if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
    return parts[0] ?? raw;
  } catch {
    return raw;
  }
}

export function VideoPlayer({
  video,
  courseId,
  lessonId,
  initialCompleted = false,
  onComplete
}: {
  video: string;
  courseId?: string;
  lessonId?: string;
  initialCompleted?: boolean;
  onComplete?: () => void;
}) {
  const { t } = useLanguage();
  const videoId = getYouTubeId(video);
  const [watchSeconds, setWatchSeconds] = useState(initialCompleted ? WATCH_UNLOCK_SECONDS : 0);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const playerRef = useRef<YTPlayer | null>(null);
  // Stable DOM id — YT IFrame API needs a string id or element; using id avoids ref-staleness
  // when YT replaces the placeholder div with its own iframe element.
  const playerId = `yt-player-${lessonId ?? videoId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const saveKey = lessonId ? `poharana:video:${lessonId}` : null;
  // Track seconds since last save to rate-limit localStorage writes
  const secondsSinceLastSave = useRef(0);

  // Create the YT player once per video/lesson
  useEffect(() => {
    let active = true;

    loadYouTubeApi().then(() => {
      if (!active) return;
      const win = window as YTWindow;
      if (!win.YT?.Player) return;

      playerRef.current = new win.YT.Player(playerId, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            if (saveKey) {
              const saved = parseInt(localStorage.getItem(saveKey) ?? "0", 10);
              // Only seek if we saved a meaningful position (> 5 s)
              if (saved > 5) event.target.seekTo(saved, true);
            }
          }
        }
      });
    });

    return () => {
      active = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Re-run only if the video or lesson changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerId]);

  // Tick every second: count watch time and save position
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      const win = window as YTWindow;
      if (!player || !win.YT?.PlayerState) return;

      if (player.getPlayerState() === win.YT.PlayerState.PLAYING) {
        setWatchSeconds((s) => Math.min(WATCH_UNLOCK_SECONDS, s + 1));

        if (saveKey) {
          secondsSinceLastSave.current += 1;
          if (secondsSinceLastSave.current >= SAVE_INTERVAL_SECONDS) {
            secondsSinceLastSave.current = 0;
            const time = player.getCurrentTime();
            if (time > 0) localStorage.setItem(saveKey, String(Math.floor(time)));
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [completed, saveKey]);

  const watchedPct = Math.round((watchSeconds / WATCH_UNLOCK_SECONDS) * 100);
  const canComplete = completed || watchedPct >= 90;

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="aspect-video w-full">
          {/* YT IFrame API replaces this div with the actual <iframe> */}
          <div id={playerId} className="h-full w-full" />
        </div>
      </div>
      {courseId && lessonId ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
          {completed ? (
            <div className="flex items-center gap-2 text-[14px] font-[800] text-[var(--success)]">
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[var(--success)] text-white">
                <svg viewBox="0 0 14 14" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                  <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {t.completedProgressSaved}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] font-[600] text-[var(--muted)]">
                {canComplete ? t.readyToCompleteHint : t.watchFullVideoHint}
              </p>
              <button
                type="button"
                disabled={!canComplete || isPending}
                onClick={() =>
                  startTransition(async () => {
                    setMessage("");
                    try {
                      await completeEmbeddedVideoLesson({ courseId, lessonId });
                      setCompleted(true);
                      onComplete?.();
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : t.couldNotCompleteLesson);
                    }
                  })
                }
                className="pr-btn-primary ms-auto !min-h-10 shrink-0 px-5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? t.savingLabel : t.markAsComplete}
              </button>
              {message ? <p className="basis-full text-sm font-[800] text-[var(--danger)]">{message}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
