export default function CoursesLoading() {
  return (
    <main className="pr-page py-8" aria-busy="true">
      <div className="mb-8 animate-pulse overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] px-6 pt-6 pb-5">
          <div className="h-3 w-32 rounded bg-[var(--surface)]" />
          <div className="mt-3 h-7 w-64 rounded bg-[var(--surface)]" />
        </div>
        <div className="px-6 py-5">
          <div className="h-12 rounded-[var(--radius)] bg-[var(--surface)]" />
        </div>
      </div>
      <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]">
            <div className="h-24 bg-[var(--surface)]" />
            <div className="grid gap-3 p-4">
              <div className="h-4 w-20 rounded-full bg-[var(--surface)]" />
              <div className="h-5 w-4/5 rounded bg-[var(--surface)]" />
              <div className="h-4 w-full rounded bg-[var(--surface)]" />
              <div className="mt-2 h-10 rounded-[var(--radius)] bg-[var(--surface)]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
