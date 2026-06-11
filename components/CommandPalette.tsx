"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { localize } from "@/lib/i18n";

type SearchResults = {
  pages: Array<{ id: string; title: string; description: string; href: string; category: string }>;
  courses: Array<{ id: string; slug?: string; titleEn?: string; titlePs?: string; titleDa?: string | null; level: string | null }>;
  lessons: Array<{
    id: string;
    titleEn?: string; titlePs?: string; titleDa?: string | null;
    module: { id: string; course: { id: string; slug?: string; titleEn?: string; titlePs?: string; titleDa?: string | null } };
  }>;
  creators: Array<{ username: string; name: string; professionalTitle: string | null; avatarUrl: string | null }>;
  learningPaths: Array<{
    slug: string;
    titleEn?: string; titlePs?: string; titleDa?: string | null;
    descriptionEn?: string; descriptionPs?: string; descriptionDa?: string | null;
  }>;
};

type FlatResult =
  | { kind: "page";     id: string; title: string; sub: string; href: string }
  | { kind: "course";   id: string; title: string; sub: string; href: string }
  | { kind: "lesson";   id: string; title: string; sub: string; href: string }
  | { kind: "creator";  id: string; title: string; sub: string; href: string; avatarUrl: string | null }
  | { kind: "path";     id: string; title: string; sub: string; href: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, t } = useLanguage();
  const router = useRouter();

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResults | null>(null);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flat: FlatResult[] = results
    ? [
        ...results.pages.map((p) => ({
          kind: "page" as const,
          id: p.id,
          title: p.title,
          sub: p.category || p.description,
          href: p.href
        })),
        ...results.courses.map((c) => ({
          kind: "course" as const,
          id: c.id,
          title: localize(locale, c.titleEn, c.titlePs, c.titleDa),
          sub: t.searchCourses,
          href: `/courses/${encodeURIComponent(c.slug ?? c.id)}`
        })),
        ...results.learningPaths.map((path) => ({
          kind: "path" as const,
          id: path.slug,
          title: localize(locale, path.titleEn, path.titlePs, path.titleDa),
          sub: t.learningPathsTitle,
          href: `/learning-paths/${encodeURIComponent(path.slug)}`
        })),
        ...results.lessons.map((l) => ({
          kind: "lesson" as const,
          id: l.id,
          title: localize(locale, l.titleEn, l.titlePs, l.titleDa),
          sub: localize(locale, l.module.course.titleEn, l.module.course.titlePs, l.module.course.titleDa),
          href: `/courses/${encodeURIComponent(l.module.course.slug ?? l.module.course.id)}/lessons/${encodeURIComponent(l.id)}`
        })),
        ...results.creators.map((c) => ({
          kind: "creator" as const,
          id: c.username,
          title: c.name,
          sub: c.professionalTitle ?? t.searchInstructors,
          href: `/creators/${encodeURIComponent(c.username)}`,
          avatarUrl: c.avatarUrl
        }))
      ]
    : [];

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as SearchResults;
        setResults(data);
        setSelected(0);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }, 220);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { search(query); }, [query, search]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); return; }
      if (e.key === "Enter" && flat[selected]) {
        e.preventDefault();
        router.push(flat[selected].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, selected, onClose, router]);

  if (!open) return null;

  const isEmpty = query.length >= 3 && !loading && flat.length === 0;
  const showGroups = flat.length > 0;
  let cursor = 0;

  function Row({ item, index }: { item: FlatResult; index: number }) {
    const active = index === selected;
    return (
      <button
        type="button"
        onMouseEnter={() => setSelected(index)}
        onClick={() => { router.push(item.href); onClose(); }}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${active ? "bg-[var(--brand)] text-white" : "hover:bg-[var(--surface)]"}`}
      >
        {item.kind === "creator" ? (
          item.avatarUrl ? (
            <Image src={item.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-[900] ${active ? "bg-white/20 text-white" : "bg-[var(--brand-50)] text-[var(--brand)]"}`}>
              {item.title.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
            </span>
          )
        ) : (
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[6px] ${active ? "bg-white/20" : "bg-[var(--surface)]"}`}>
            {item.kind === "course" ? (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M14 7 8 4 2 7l6 3 6-3Z" stroke={active ? "#fff" : "var(--brand)"} strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M4 8.5v3.3c1.2.9 2.4 1.2 4 1.2s2.8-.3 4-1.2V8.5" stroke={active ? "#fff" : "var(--brand)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : item.kind === "lesson" ? (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M4 4h8M4 7h8M4 10h5" stroke={active ? "#fff" : "var(--brand)"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M8 2.5 13.5 6v7.5h-11V6L8 2.5Z" stroke={active ? "#fff" : "var(--brand)"} strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M6 13.5V9h4v4.5" stroke={active ? "#fff" : "var(--brand)"} strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-[700] ${active ? "text-white" : "text-[var(--ink)]"}`}>{item.title}</p>
          <p className={`truncate text-[11px] font-[600] ${active ? "text-white/70" : "text-[var(--muted)]"}`}>{item.sub}</p>
        </div>
        {active && (
          <kbd className="shrink-0 rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-[700] text-white">↵</kbd>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.22)] ring-1 ring-black/8">

        {/* Input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          {loading ? (
            <svg className="h-4 w-4 shrink-0 animate-spin text-[var(--brand)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0 text-[var(--muted)]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            dir="auto"
            className="flex-1 bg-transparent text-sm font-[600] text-[var(--ink)] placeholder:text-[var(--muted-2)] outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-[700] text-[var(--muted)] sm:block">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query || query.length < 2 ? (
            <p className="px-4 py-8 text-center text-sm font-[600] text-[var(--muted-2)]">{t.searchTypeToStart}</p>
          ) : isEmpty ? (
            <p className="px-4 py-8 text-center text-sm font-[600] text-[var(--muted-2)]">{t.searchNoResults}</p>
          ) : showGroups ? (
            <>
              {results!.pages.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-[900] uppercase tracking-[1.5px] text-[var(--muted-2)]">{t.searchPages}</p>
                  {results!.pages.map((_, i) => { const idx = cursor++; return <Row key={flat[idx].id + idx} item={flat[idx]} index={idx} />; })}
                </div>
              )}
              {results!.courses.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-[900] uppercase tracking-[1.5px] text-[var(--muted-2)]">{t.searchCourses}</p>
                  {results!.courses.map((_, i) => { const idx = cursor++; return <Row key={flat[idx].id + idx} item={flat[idx]} index={idx} />; })}
                </div>
              )}
              {results!.learningPaths.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-[900] uppercase tracking-[1.5px] text-[var(--muted-2)]">{t.learningPathsTitle}</p>
                  {results!.learningPaths.map((_, i) => { const idx = cursor++; return <Row key={flat[idx].id + idx} item={flat[idx]} index={idx} />; })}
                </div>
              )}
              {results!.lessons.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-[900] uppercase tracking-[1.5px] text-[var(--muted-2)]">{t.searchLessons}</p>
                  {results!.lessons.map((_, i) => { const idx = cursor++; return <Row key={flat[idx].id + idx} item={flat[idx]} index={idx} />; })}
                </div>
              )}
              {results!.creators.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-[900] uppercase tracking-[1.5px] text-[var(--muted-2)]">{t.searchInstructors}</p>
                  {results!.creators.map((_, i) => { const idx = cursor++; return <Row key={flat[idx].id + idx} item={flat[idx]} index={idx} />; })}
                </div>
              )}
            </>
          ) : null}
        </div>

        {flat.length > 0 && (
          <div className="border-t border-[var(--border)] px-4 py-2 text-[11px] font-[600] text-[var(--muted-2)]">
            ↑↓ navigate &nbsp;·&nbsp; ↵ open &nbsp;·&nbsp; {t.searchClose}
          </div>
        )}
      </div>
    </div>
  );
}
