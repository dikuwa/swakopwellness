import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasError = params.error === "invalid";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Staff access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use the staff account created by the owner bootstrap script. Public registration is disabled.
        </p>
        {hasError ? (
          <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            Check the email and password, then try again.
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <button type="submit" className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-primary">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
