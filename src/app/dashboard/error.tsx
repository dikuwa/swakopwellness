"use client";

import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          An unexpected error occurred in this section. Please try again or go back.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
