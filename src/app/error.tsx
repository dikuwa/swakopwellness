"use client";

import Link from "next/link";
import Image from "next/image";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-8 text-center text-foreground">
      <Link href="/" className="flex items-center" aria-label="Swakop Wellness Centre">
        <Image
          src="/brand/logo-green.svg"
          alt="Swakop Wellness Centre"
          width={128}
          height={75}
          priority
          className="h-auto w-28"
        />
      </Link>
      <div className="mt-8 max-w-sm">
        <h1 className="text-4xl tracking-[-0.03em]">Something went wrong</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          An unexpected error occurred. Please try again or come back later.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
