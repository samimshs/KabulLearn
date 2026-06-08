/**
 * Khan Academy-style 3-state lesson status icon, shared by the lesson view and
 * the quiz view sidebars so they stay visually consistent.
 *  - not_started → muted content-type glyph
 *  - in_progress → amber-tinted glyph
 *  - completed   → green circle + checkmark
 */

export type LessonState = "not_started" | "in_progress" | "completed";
export type LessonKind = "video" | "reading" | "quiz";

export function lessonKindOf(lesson: {
  type: string;
  youtubeUrl?: string | null;
  readingEn?: string | null;
  readingPs?: string | null;
}): LessonKind {
  if (lesson.type === "QUIZ") return "quiz";
  if (lesson.type === "READING" || (!lesson.youtubeUrl && Boolean(lesson.readingEn || lesson.readingPs))) {
    return "reading";
  }
  return "video";
}

function TypeGlyph({ kind }: { kind: LessonKind }) {
  if (kind === "reading") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
        <path d="M2.5 3.25c2.05-.6 3.87-.28 5.5.95v10c-1.63-1.23-3.45-1.55-5.5-.95Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 4.2c1.63-1.23 3.45-1.55 5.5-.95v10c-2.05-.6-3.87-.28-5.5.95Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 4.2v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "quiz") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.25 6.1a2 2 0 0 1 3.55 1.25c0 1.7-1.8 1.72-1.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 12.25h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 6.5l4-2v7l-4-2V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function LessonStateIcon({ state, kind }: { state: LessonState; kind: LessonKind }) {
  if (state === "completed") {
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[var(--success)] text-white" aria-label="Completed">
        <svg viewBox="0 0 14 14" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
          <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === "in_progress") {
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#FFF4DE] text-[#D97706] ring-1 ring-[#F2C879]" aria-label="In progress">
        <TypeGlyph kind={kind} />
      </span>
    );
  }
  return (
    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center text-[var(--muted-2)]" aria-label="Not started">
      <TypeGlyph kind={kind} />
    </span>
  );
}
