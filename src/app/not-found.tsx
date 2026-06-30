import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-8 text-center text-foreground">
      <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold tracking-wider text-primary-foreground">
          SW
        </span>
        Swakop Wellness Centre
      </Link>
      <div className="mt-8 max-w-sm">
        <h1 className="text-4xl tracking-[-0.03em]">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]"
      >
        Back to home
      </Link>
    </div>
  );
}
