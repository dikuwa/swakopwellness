export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 animate-pulse">
      <div className="max-w-3xl space-y-4">
        <div className="h-5 w-32 rounded-lg bg-surface-muted" />
        <div className="h-12 w-96 rounded-xl bg-surface-muted" />
        <div className="h-5 w-3/4 rounded-lg bg-surface-muted" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-5 w-24 rounded-lg bg-surface-muted" />
              <div className="h-11 w-full rounded-xl bg-surface-muted" />
              <div className="h-11 w-full rounded-xl bg-surface-muted" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-[1.5rem] bg-surface-muted p-6" />
      </div>
    </div>
  );
}
