export default function LessonLoading() {
  return (
    <main
      className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-6 px-5 pb-16 pt-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8"
      aria-busy="true"
    >
      {/* Sidebar skeleton */}
      <aside className="hidden animate-pulse lg:block">
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] p-4">
            <div className="h-4 w-32 rounded bg-[var(--surface)]" />
          </div>
          <div className="grid gap-4 p-4">
            {Array.from({ length: 3 }).map((_, m) => (
              <div key={m} className="grid gap-1.5">
                <div className="h-3 w-24 rounded bg-[var(--surface)]" />
                {Array.from({ length: 3 }).map((_, l) => (
                  <div key={l} className="h-9 rounded-[var(--radius)] bg-[var(--surface)]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <section className="animate-pulse">
        {/* Video */}
        <div className="aspect-video w-full rounded-[var(--radius-xl)] bg-[var(--surface)]" />
        {/* Title + meta */}
        <div className="mt-5 h-7 w-2/3 rounded bg-[var(--surface)]" />
        <div className="mt-3 flex gap-3">
          <div className="h-4 w-20 rounded-full bg-[var(--surface)]" />
          <div className="h-4 w-24 rounded-full bg-[var(--surface)]" />
        </div>
        {/* Description */}
        <div className="mt-5 grid gap-2">
          <div className="h-4 w-full rounded bg-[var(--surface)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--surface)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--surface)]" />
        </div>
        {/* Nav buttons */}
        <div className="mt-8 flex justify-between gap-3">
          <div className="h-10 w-32 rounded-[var(--radius)] bg-[var(--surface)]" />
          <div className="h-10 w-32 rounded-[var(--radius)] bg-[var(--surface)]" />
        </div>
      </section>
    </main>
  );
}
