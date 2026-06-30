export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 animate-pulse">
      <div className="h-12 w-32 rounded-xl bg-surface-muted" />
      <div className="mt-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="h-5 w-3/4 rounded-lg bg-surface-muted" />
            <div className="h-4 w-full rounded-lg bg-surface-muted" />
            <div className="h-4 w-2/3 rounded-lg bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
