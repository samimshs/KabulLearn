"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { completeVideoLesson, recordVideoHeartbeat } from "@/lib/actions/video-actions";
import { useLanguage } from "@/components/LanguageProvider";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => {
        getCurrentTime: () => number;
        getDuration: () => number;
        getPlayerState: () => number;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
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

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
}

function youtubeErrorMessage(code: number, fallback: string) {
  if (code === 2) return "This YouTube link is invalid. Please ask the educator to update the lesson video.";
  if (code === 5) return "This video cannot be played in the embedded player.";
  if (code === 100) return "This YouTube video is unavailable or private.";
  if (code === 101 || code === 150) return "This YouTube video does not allow playback on external websites.";
  return fallback;
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
  const elementId = `yt-player-${videoId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const playerRef = useRef<InstanceType<NonNullable<typeof window.YT>["Player"]> | null>(null);
  const latestHeartbeat = useRef<{ id: string; signature: string } | null>(null);
  const [watchedPct, setWatchedPct] = useState(0);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initialCompleted);
  const [resumeBanner, setResumeBanner] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function captureHeartbeat(positionSec: number, durationSec: number) {
      if (!courseId || !lessonId || !durationSec || durationSec <= 0 || !Number.isFinite(positionSec)) return;
      const pct = Math.min(100, Math.round((positionSec / durationSec) * 100));
      setWatchedPct((current) => Math.max(current, pct));
      try {
        const heartbeat = await recordVideoHeartbeat({ courseId, lessonId, positionSec, durationSec });
        latestHeartbeat.current = { id: heartbeat.id, signature: heartbeat.signature };
      } catch {
        // Keep playback smooth; completion will fail if heartbeat is invalid.
      }
    }

    function sampleNow() {
      const player = playerRef.current;
      if (!player) return;
      captureHeartbeat(player.getCurrentTime(), player.getDuration());
    }

    async function init() {
      // Step 1: fetch resume position BEFORE touching the player.
      // This guarantees the position is in the ref when onReady fires.
      let resumePos = 0;
      if (lessonId && !initialCompleted) {
        try {
          const r = await fetch(`/api/lesson/heartbeat?lessonId=${encodeURIComponent(lessonId)}`);
          const data = await r.json() as { positionSec: number };
          if (!cancelled && data.positionSec > 5) {
            resumePos = data.positionSec;
            setResumeBanner(data.positionSec);
          }
        } catch { /* resume is optional */ }
      }
      if (cancelled) return;

      // Step 2: load the YT iframe API (no-op if already loaded).
      await loadYouTubeApi();
      if (cancelled || !window.YT?.Player) return;

      // Step 3: create the player. resumePos is now definitely known.
      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: { modestbranding: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            if (resumePos > 5) {
              playerRef.current?.seekTo(resumePos, true);
            }
          },
          onStateChange: (event) => {
            // 0 = ENDED: credit full watch so "Mark as complete" unlocks.
            // 2 = PAUSED: capture a heartbeat immediately.
            if (event.data === 0) {
              const duration = playerRef.current?.getDuration() ?? 0;
              if (duration > 0) captureHeartbeat(duration, duration);
            } else if (event.data === 2) {
              sampleNow();
            }
          },
          onError: (event) => {
            setMessage(youtubeErrorMessage(event.data, t.couldNotCompleteLesson));
          }
        }
      });

      // Sample every 2.5s while playing.
      interval = setInterval(sampleNow, 2500);
    }

    init();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [courseId, elementId, lessonId, videoId, initialCompleted]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="grid gap-3">
      {resumeBanner !== null && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(0,87,255,0.25)] bg-[rgba(0,87,255,0.06)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[var(--brand)]" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
            </svg>
            <span className="text-[13px] font-[700] text-[var(--ink)]">
              {t.resumeVideo} — {formatTime(resumeBanner)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setResumeBanner(null)}
            className="text-[12px] font-[700] text-[var(--muted)] underline-offset-2 hover:underline"
          >
            ✕
          </button>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="aspect-video w-full">
          <div id={elementId} className="h-full w-full" />
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
                {watchedPct < 90 ? t.watchFullVideoHint : t.readyToCompleteHint}
              </p>
              <button
                type="button"
                disabled={watchedPct < 90 || isPending || !latestHeartbeat.current}
                onClick={() =>
                  startTransition(async () => {
                    setMessage("");
                    const heartbeat = latestHeartbeat.current;
                    if (!heartbeat) return;
                    try {
                      await completeVideoLesson({ courseId, lessonId, heartbeatId: heartbeat.id, signature: heartbeat.signature });
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
