import Link from "next/link";
import Image from "next/image";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-8 text-center text-foreground">
      <Link href="/dashboard" className="flex items-center" aria-label="Dashboard">
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
        <h1 className="text-4xl tracking-[-0.03em]">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
        >
          Back to website
        </Link>
      </div>
    </div>
  );
}
