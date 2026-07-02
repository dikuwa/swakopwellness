export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.15" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-muted ${className}`} />;
}

export function LoadingButton({
  loading,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground h-11 transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          <span>Saving...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
