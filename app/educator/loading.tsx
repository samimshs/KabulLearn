export default function EducatorLoading() {
  return (
    <main className="pr-page py-8" aria-busy="true">
      <div className="animate-pulse">
        <div className="h-3 w-32 rounded bg-[var(--surface)]" />
        <div className="mt-3 h-8 w-80 rounded bg-[var(--surface)]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="h-80 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)]" />
          <div className="h-80 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)]" />
        </div>
      </div>
    </main>
  );
}
