export default function CourseLoading() {
  return (
    <main className="pr-page py-8" aria-busy="true">
      <div className="animate-pulse">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-8">
          <div className="h-4 w-24 rounded-full bg-[var(--surface)]" />
          <div className="mt-4 h-9 w-3/4 rounded bg-[var(--surface)]" />
          <div className="mt-4 h-4 w-full max-w-2xl rounded bg-[var(--surface)]" />
          <div className="mt-2 h-4 w-2/3 max-w-xl rounded bg-[var(--surface)]" />
          <div className="mt-6 h-11 w-44 rounded-[var(--radius)] bg-[var(--surface)]" />
        </div>
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
