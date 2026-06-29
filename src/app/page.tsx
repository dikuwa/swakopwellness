const checks = [
  "Next.js App Router and TypeScript are configured.",
  "Design tokens are available as OKLCH CSS variables.",
  "Drizzle schema and reviewed auth migration are generated.",
  "Email/password auth primitives and permission helpers are in place.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Phase 1
          </p>
          <h1 className="text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            Foundation, auth and permissions are underway.
          </h1>
          <p className="mt-6 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
            This phase adds the protected dashboard entry, database-backed sessions and role permissions. Business data, services, bookings and documents remain out of scope until their phases.
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-5 py-4 text-sm font-medium text-secondary-foreground">
          Current gate: database migration
        </div>
      </section>

      <section className="mx-auto mt-8 grid w-full max-w-5xl gap-3 sm:grid-cols-2">
        {checks.map((check) => (
          <div key={check} className="rounded-2xl border border-border bg-surface p-5 text-sm leading-6 shadow-[0_10px_40px_oklch(0.235_0.025_158_/_0.04)]">
            {check}
          </div>
        ))}
      </section>
    </main>
  );
}
