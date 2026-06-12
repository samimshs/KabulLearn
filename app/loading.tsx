export default function HomeLoading() {
  return (
    <main className="pr-page kl-home-page" aria-busy="true">
      {/* Hero */}
      <section className="kl-home-hero grid animate-pulse items-start gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="kl-home-copy flex flex-col gap-5">
          <div className="h-3 w-28 rounded-full bg-[var(--surface)]" />
          <div className="h-10 w-4/5 rounded bg-[var(--surface)]" />
          <div className="h-10 w-2/3 rounded bg-[var(--surface)]" />
          <div className="h-5 w-full rounded bg-[var(--surface)]" />
          <div className="h-5 w-3/4 rounded bg-[var(--surface)]" />
          <div className="flex gap-3">
            <div className="h-11 w-40 rounded-[var(--radius)] bg-[var(--surface)]" />
            <div className="h-11 w-36 rounded-[var(--radius)] bg-[var(--surface)]" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 w-36 rounded-full bg-[var(--surface)]" />
            ))}
          </div>
        </div>
        <div className="kl-home-art rounded-[var(--radius-xl)] bg-[var(--surface)]" style={{ minHeight: 340 }} />
      </section>

      {/* Featured courses */}
      <div className="kl-home-body mt-14 animate-pulse">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="h-3 w-24 rounded-full bg-[var(--surface)]" />
            <div className="mt-2 h-7 w-48 rounded bg-[var(--surface)]" />
          </div>
          <div className="h-4 w-20 rounded bg-[var(--surface)]" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]">
              <div className="h-24 bg-[var(--surface)]" />
              <div className="grid gap-3 p-4">
                <div className="h-4 w-20 rounded-full bg-[var(--surface)]" />
                <div className="h-5 w-4/5 rounded bg-[var(--surface)]" />
                <div className="h-4 w-full rounded bg-[var(--surface)]" />
                <div className="mt-1 h-10 rounded-[var(--radius)] bg-[var(--surface)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
