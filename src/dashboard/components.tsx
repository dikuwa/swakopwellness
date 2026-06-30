"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const linkGroups = [
  {
    label: "Business",
    links: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/bookings", label: "Bookings" },
      { href: "/dashboard/calendar", label: "Calendar" },
      { href: "/dashboard/chat-conversations", label: "Chat" },
      { href: "/dashboard/follow-ups", label: "Follow-ups" },
      { href: "/dashboard/clients", label: "Clients" },
    ],
  },
  {
    label: "Services",
    links: [
      { href: "/dashboard/services", label: "Services" },
      { href: "/dashboard/faqs", label: "FAQs" },
      { href: "/dashboard/policies", label: "Policies" },
      { href: "/dashboard/media", label: "Media" },
    ],
  },
  {
    label: "Finance",
    links: [
      { href: "/dashboard/invoices", label: "Invoices" },
      { href: "/dashboard/quotations", label: "Quotations" },
      { href: "/dashboard/receipts", label: "Receipts" },
      { href: "/dashboard/payments", label: "Payments" },
      { href: "/dashboard/reports", label: "Reports" },
    ],
  },
  {
    label: "System",
    links: [
      { href: "/dashboard/notifications", label: "Notifications" },
      { href: "/dashboard/activity-log", label: "Activity Log" },
      { href: "/dashboard/users", label: "Users" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
];

function BrandMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold tracking-wider text-primary-foreground">
      SW
    </span>
  );
}

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/chat-conversations", label: "Chat" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/follow-ups", label: "Follow-ups" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/quotations", label: "Quotations" },
  { href: "/dashboard/receipts", label: "Receipts" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/activity-log", label: "Activity Log" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/media", label: "Media" },
  { href: "/dashboard/faqs", label: "FAQs" },
  { href: "/dashboard/policies", label: "Policies" },
];

export function DashboardNav() {
  return (
    <nav aria-label="Dashboard navigation" className="mb-6 flex flex-wrap gap-2 text-sm">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className="rounded-xl border border-border px-3 py-2 font-semibold transition-colors hover:bg-surface-muted">{link.label}</Link>
      ))}
    </nav>
  );
}

export function DashboardSidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-6">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 text-sm font-semibold" onClick={onNavClick}>
        <BrandMark />
        Dashboard
      </Link>
      {linkGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavClick}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DashboardLayout({ children, signOutForm }: { children: React.ReactNode; signOutForm: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 md:sticky md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <DashboardSidebar onNavClick={() => setSidebarOpen(false)} />
        </div>
        <div className="border-t border-border p-4">
          {signOutForm}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/95 px-5 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-surface-muted"
            aria-label="Open sidebar"
          >
            <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6l16 0M4 12l16 0M4 18l16 0" />
            </svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
            <BrandMark />
            Dashboard
          </Link>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 sm:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
