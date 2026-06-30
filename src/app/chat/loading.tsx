export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 animate-pulse">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8 space-y-4">
          <div className="h-5 w-32 rounded-lg bg-surface-muted" />
          <div className="h-10 w-3/4 rounded-xl bg-surface-muted" />
          <div className="h-20 w-full rounded-2xl bg-surface-muted" />
          <div className="h-20 w-full rounded-2xl bg-surface-muted" />
        </div>
        <div className="rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8 space-y-5">
          <div className="h-11 w-full rounded-xl bg-surface-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-11 rounded-xl bg-surface-muted" />
            <div className="h-11 rounded-xl bg-surface-muted" />
          </div>
          <div className="h-11 rounded-xl bg-surface-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-11 rounded-xl bg-surface-muted" />
            <div className="h-11 rounded-xl bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
