import { requireAuth } from "@/auth/session";

/**
 * DashboardShell is a thin wrapper that ensures the user is authenticated.
 * The shared dashboard layout (src/app/dashboard/layout.tsx) handles the
 * sidebar, header, notifications, and avatar rendering for all child routes.
 * Individual pages should only render their page content.
 */
export async function DashboardShell({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
