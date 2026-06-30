import Link from "next/link";
import { loginAction } from "./actions";
import { Card, Input, Label } from "@/ui/components";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasError = params.error === "invalid";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10 text-foreground">
      <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold tracking-wider text-primary-foreground">
          SW
        </span>
        Swakop Wellness Centre
      </Link>
      <Card className="mt-8 w-full max-w-md p-6 sm:p-8">
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Staff access</p>
        <h1 className="mt-2 text-2xl tracking-[-0.03em] sm:text-3xl">Sign in</h1>
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required className="mt-2" />
          </div>
          <button type="submit" className="h-11 w-full cursor-pointer rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]">
            Sign in
          </button>
        </form>
      </Card>
    </main>
  );
}
