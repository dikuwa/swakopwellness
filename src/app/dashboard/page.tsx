import { requireAuth } from "@/auth/session";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Welcome, {user.name}</h1>
            <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
              Phase 1 protects this dashboard with database-backed sessions and server-side permission helpers. Operational modules start in later phases.
            </p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted">
              Sign out
            </button>
          </form>
        </div>
        <div className="mt-8 rounded-2xl bg-surface-muted p-5">
          <p className="text-sm font-medium text-secondary-foreground">Signed in as {user.email}</p>
          <p className="mt-2 text-sm text-muted-foreground">Permissions loaded: {user.permissions.length}</p>
        </div>
      </section>
    </main>
  );
}
