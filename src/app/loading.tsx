export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="space-y-6 sm:space-y-8">
        <div className="h-6 w-32 rounded-lg bg-surface-muted animate-pulse" />
        <div className="h-16 w-3/4 rounded-xl bg-surface-muted animate-pulse" />
        <div className="h-8 w-1/2 rounded-lg bg-surface-muted animate-pulse" />
      </div>
    </div>
  );
}
