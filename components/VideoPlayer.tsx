"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { completeEmbeddedVideoLesson } from "@/lib/actions/video-actions";
import { useLanguage } from "@/components/LanguageProvider";

const WATCH_UNLOCK_SECONDS = 60;
const YOUTUBE_IFRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

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

function embedUrl(videoId: string) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
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
  const src = useMemo(() => embedUrl(videoId), [videoId]);
  const [watchSeconds, setWatchSeconds] = useState(initialCompleted ? WATCH_UNLOCK_SECONDS : 0);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initialCompleted);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!iframeLoaded || completed) return;
    const interval = setInterval(() => {
      setWatchSeconds((current) => Math.min(WATCH_UNLOCK_SECONDS, current + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [completed, iframeLoaded]);

  const watchedPct = Math.round((watchSeconds / WATCH_UNLOCK_SECONDS) * 100);
  const canComplete = completed || watchedPct >= 90;

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="aspect-video w-full">
          <iframe
            key={src}
            src={src}
            title={t.video}
            className="h-full w-full"
            allow={YOUTUBE_IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setIframeLoaded(true)}
          />
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
