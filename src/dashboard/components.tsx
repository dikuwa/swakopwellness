import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/chat-conversations", label: "Chat Conversations" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/follow-ups", label: "Follow-ups" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/receipts", label: "Receipts" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/activity-log", label: "Activity Log" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/faqs", label: "FAQs" },
  { href: "/dashboard/policies", label: "Policies" },
];

export function DashboardNav() {
  return (
    <nav aria-label="Dashboard navigation" className="mb-6 flex flex-wrap gap-2 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="rounded-xl border border-border px-3 py-2 font-semibold hover:bg-surface-muted">{link.label}</Link>
      ))}
    </nav>
  );
}
