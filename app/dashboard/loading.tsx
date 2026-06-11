export default function DashboardLoading() {
  return (
    <main className="pr-page py-8" aria-busy="true">
      <div className="animate-pulse">
        <div className="h-3 w-28 rounded bg-[var(--surface)]" />
        <div className="mt-3 h-8 w-72 rounded bg-[var(--surface)]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
        <div className="mt-8 h-64 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
