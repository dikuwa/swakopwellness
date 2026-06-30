export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 animate-pulse">
      <div className="h-4 w-24 rounded-lg bg-surface-muted" />
      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-surface">
        <div className="aspect-[16/9] w-full bg-surface-muted" />
      </div>
      <div className="mt-6 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8 space-y-4">
        <div className="h-5 w-32 rounded-lg bg-surface-muted" />
        <div className="h-10 w-3/4 rounded-xl bg-surface-muted" />
        <div className="h-6 w-full rounded-lg bg-surface-muted" />
        <div className="h-6 w-5/6 rounded-lg bg-surface-muted" />
        <div className="h-6 w-4/6 rounded-lg bg-surface-muted" />
      </div>
    </div>
  );
}
