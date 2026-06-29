export default function PermissionDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-lg rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Permission denied</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Access is restricted</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account does not have permission for this dashboard action. Ask the owner to update your role if this is incorrect.
        </p>
      </section>
    </main>
  );
}
