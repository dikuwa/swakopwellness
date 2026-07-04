import { requireAuth } from "@/auth/session";
import { getUnreadNotificationCount } from "@/notifications/create";
import { DashboardLayout } from "@/dashboard/components";

export const dynamic = "force-dynamic";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <DashboardLayout userName={user.name} userEmail={user.email} unreadCount={unreadCount}>
      {children}
    </DashboardLayout>
  );
}
