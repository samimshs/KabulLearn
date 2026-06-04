"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { completeVideoLesson, recordVideoHeartbeat } from "@/lib/actions/video-actions";

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
          };
        }
      ) => {
        getCurrentTime: () => number;
        getDuration: () => number;
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
  lessonId
}: {
  video: string;
  courseId?: string;
  lessonId?: string;
}) {
  const videoId = getYouTubeId(video);
  const elementId = `yt-player-${videoId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const playerRef = useRef<InstanceType<NonNullable<typeof window.YT>["Player"]> | null>(null);
  const latestHeartbeat = useRef<{ id: string; signature: string } | null>(null);
  const [watchedPct, setWatchedPct] = useState(0);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin
        }
      });

      interval = setInterval(async () => {
        const player = playerRef.current;
        if (!player || !courseId || !lessonId) return;

        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        if (!duration || duration <= 0 || !Number.isFinite(currentTime)) return;

        const pct = Math.min(100, Math.round((currentTime / duration) * 100));
        setWatchedPct((current) => Math.max(current, pct));

        try {
          const heartbeat = await recordVideoHeartbeat({
            courseId,
            lessonId,
            positionSec: currentTime,
            durationSec: duration
          });
          latestHeartbeat.current = { id: heartbeat.id, signature: heartbeat.signature };
        } catch {
          // Keep playback smooth; completion will fail if heartbeat is invalid.
        }
      }, 5000);
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
          <div className="flex items-center justify-between gap-3 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
            <span>Watch progress</span>
            <span>{watchedPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
            <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${watchedPct}%` }} />
          </div>
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
                  setMessage("Lesson completed.");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Could not complete lesson.");
                }
              })
            }
            className="pr-btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Completing..." : "Complete lesson"}
          </button>
          {message ? <p className="mt-3 text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
