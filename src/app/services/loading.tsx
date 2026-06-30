export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 animate-pulse">
      <div className="h-12 w-48 rounded-xl bg-surface-muted" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface">
            <div className="aspect-[16/9] rounded-t-2xl bg-surface-muted" />
            <div className="p-5 space-y-3">
              <div className="h-6 w-3/4 rounded-lg bg-surface-muted" />
              <div className="h-4 w-full rounded-lg bg-surface-muted" />
              <div className="h-4 w-2/3 rounded-lg bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
