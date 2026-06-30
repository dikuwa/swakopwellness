export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 animate-pulse">
      <div className="h-4 w-24 rounded-lg bg-surface-muted" />
      <div className="mt-6 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8 space-y-4">
        <div className="h-12 w-3/4 rounded-xl bg-surface-muted" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded-lg bg-surface-muted" />
          <div className="h-4 w-5/6 rounded-lg bg-surface-muted" />
          <div className="h-4 w-4/6 rounded-lg bg-surface-muted" />
          <div className="h-4 w-full rounded-lg bg-surface-muted" />
          <div className="h-4 w-3/4 rounded-lg bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
