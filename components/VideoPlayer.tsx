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
          };
        }
      ) => {
        getCurrentTime: () => number;
        getDuration: () => number;
        getPlayerState: () => number;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function getYouTubeId(value: string) {
  if (!value.includes("youtube.com") && !value.includes("youtu.be")) {
    return value;
  }

  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }
    return url.searchParams.get("v") ?? value;
  } catch {
    return value;
  }
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    // Records a heartbeat for the given position; updates the watched %.
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
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      captureHeartbeat(currentTime, duration);
    }

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin
        },
        events: {
          onStateChange: (event) => {
            // YT states: 0 = ENDED, 2 = PAUSED. On end, credit a full watch so
            // even very short videos enable the "Mark as complete" button.
            if (event.data === 0) {
              const duration = playerRef.current?.getDuration() ?? 0;
              if (duration > 0) captureHeartbeat(duration, duration);
            } else if (event.data === 2) {
              sampleNow();
            }
          }
        }
      });

      // Sample every 2.5s so progress (and a valid heartbeat) is captured quickly.
      interval = setInterval(sampleNow, 2500);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      playerRef.current?.destroy();
    };
  }, [courseId, elementId, lessonId, videoId]);

  return (
    <div className="grid gap-3">
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
                {watchedPct < 90
                  ? t.watchFullVideoHint
                  : t.readyToCompleteHint}
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
                      await completeVideoLesson({
                        courseId,
                        lessonId,
                        heartbeatId: heartbeat.id,
                        signature: heartbeat.signature
                      });
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
