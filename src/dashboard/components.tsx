"use client";

import {
    Activity,
    Bell,
    CalendarCheck,
    CalendarDays,
    ChartNoAxesCombined,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    CreditCard,
    ExternalLink,
    FileText,
    FolderTree,
    HeartPulse,
    History,
    LayoutDashboard,
    ListTodo,
    LogOut,
    Menu,
    MessageCircle,
    Settings,
    ShieldCheck,
    UserRoundCog,
    Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { logoutAction } from "./logout-action";

// ── Icon map ─────────────────────────────────────────────

const iconMap: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/bookings": CalendarCheck,
  "/dashboard/calendar": CalendarDays,
  "/dashboard/follow-ups": ListTodo,
  "/dashboard/clients": Users,
  "/dashboard/services": HeartPulse,
  "/dashboard/services/categories": FolderTree,
  "/dashboard/services/suitability": Activity,
  "/dashboard/faqs": CircleHelp,
  "/dashboard/policies": ShieldCheck,

  "/dashboard/chat-conversations": MessageCircle,
  "/dashboard/documents": FileText,
  "/dashboard/payments": CreditCard,
  "/dashboard/reports": ChartNoAxesCombined,
  "/dashboard/notifications": Bell,
  "/dashboard/activity-log": History,
  "/dashboard/users": UserRoundCog,
  "/dashboard/settings": Settings,
};

function NavIcon({ href, className }: { href: string; className?: string }) {
  const Icon = iconMap[href];
  if (!Icon) return null;
  return <Icon className={className ?? "h-4 w-4 shrink-0"} aria-hidden="true" />;
}

// ── Nav data ─────────────────────────────────────────────

interface NavChild {
  href: string;
  label: string;
}

interface NavLink {
  href: string;
  label: string;
  children?: NavChild[];
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

const linkGroups: NavGroup[] = [
  {
    label: "OPERATIONS",
    links: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/bookings", label: "Bookings" },
      { href: "/dashboard/calendar", label: "Calendar" },
      { href: "/dashboard/follow-ups", label: "Follow-ups" },
      { href: "/dashboard/clients", label: "Clients" },
    ],
  },
  {
    label: "CONTENT",
    links: [
      {
        href: "/dashboard/services",
        label: "Services",
        children: [
          { href: "/dashboard/services/categories", label: "Categories" },
          { href: "/dashboard/services/suitability", label: "Screening" },
        ],
      },
      { href: "/dashboard/faqs", label: "FAQs" },
      { href: "/dashboard/policies", label: "Policies" },
      { href: "/dashboard/chat-conversations", label: "Chat" },
    ],
  },
  {
    label: "FINANCE & DOCUMENTS",
    links: [
      { href: "/dashboard/documents", label: "Documents" },
      { href: "/dashboard/payments", label: "Payments" },
      { href: "/dashboard/reports", label: "Reports" },
    ],
  },
  {
    label: "SYSTEM",
    links: [
      { href: "/dashboard/notifications", label: "Notifications" },
      { href: "/dashboard/activity-log", label: "Activity Log" },
      { href: "/dashboard/users", label: "Users" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
];

// ── Collapsible group key ───────────────────────────────

function groupStorageKey(label: string) {
  return `swc_sidebar_group_${label}`;
}

function collapseStorageKey() {
  return "swc_sidebar_collapsed";
}

// ── BrandMark ────────────────────────────────────────────

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Image
      src="/brand/logo-green.svg"
      alt="Swakop Wellness Centre"
      width={collapsed ? 32 : 130}
      height={collapsed ? 32 : 76}
      className={`shrink-0 ${collapsed ? "h-8 w-8" : "h-auto w-24 sm:w-28"}`}
      priority
    />
  );
}

// ── Tooltip wrapper ──────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group/tooltip relative">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

// ── Sidebar link ─────────────────────────────────────────

function SidebarLink({
  href,
  label,
  collapsed,
  active,
  onNavClick,
}: {
  href: string;
  label: string;
  collapsed?: boolean;
  active?: boolean;
  onNavClick?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
        collapsed ? "justify-center px-2" : ""
      } ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <NavIcon href={href} className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return <Tooltip label={label}>{link}</Tooltip>;
  }

  return link;
}

// ── Sidebar ──────────────────────────────────────────────

function DashboardSidebar({
  collapsed,
  onNavClick,
  onToggle,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    const saved: Record<string, boolean> = {};
    for (const group of linkGroups) {
      const val = sessionStorage.getItem(groupStorageKey(group.label));
      if (val !== null) saved[group.label] = val === "true";
      else saved[group.label] = true; // default open
    }
    return saved;
  });

  // Compute whether a nav group is open based on user toggle only
  // Manual toggle always takes precedence over active route
  const isGroupOpen = useCallback(
    (label: string): boolean => {
      const userToggle = openGroups[label];
      // Use user's explicit toggle preference (default open)
      return userToggle !== undefined ? userToggle : true;
    },
    [openGroups],
  );

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      sessionStorage.setItem(groupStorageKey(label), String(next[label]));
      return next;
    });
  }, []);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const isChildActive = useCallback(
    (children: NavChild[]) => {
      return children.some((child) => isActive(child.href));
    },
    [isActive],
  );

  return (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-6">
      {/* Sidebar Header */}
      <div className={`flex items-center ${collapsed ? "flex-col gap-4" : "justify-between"}`}>
        <Link
          href="/dashboard"
          className="flex items-center"
          onClick={onNavClick}
          aria-label="Dashboard"
        >
          <BrandMark collapsed={collapsed} />
        </Link>
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      </div>

      {linkGroups.map((group) => {
        const groupOpen = isGroupOpen(group.label);

        // Don't show children labels when collapsed
        return (
          <div key={group.label}>
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={groupOpen}
                aria-controls={`nav-group-${group.label}`}
                className="mb-1.5 flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs font-semibold tracking-tighter text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    groupOpen ? "rotate-0" : "-rotate-90"
                  }`}
                  aria-hidden="true"
                />
              </button>
            )}

            <div
              id={!collapsed ? `nav-group-${group.label}` : undefined}
              className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-200 ${
                  groupOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {group.links.map((link) => {
                const linkActive = isActive(link.href);
                const childActive = link.children && isChildActive(link.children);

                if (collapsed) {
                  // In collapsed mode, show only top-level links
                  return (
                    <SidebarLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      collapsed
                      active={linkActive}
                      onNavClick={onNavClick}
                    />
                  );
                }

                return (
                  <div key={link.href}>
                    <SidebarLink
                      href={link.href}
                      label={link.label}
                      active={linkActive}
                      onNavClick={onNavClick}
                    />
                    {link.children && (linkActive || childActive) && (
                      <div className="ml-4 mt-1 grid gap-0.5 border-l border-border pl-3">
                        {link.children.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavClick}
                              aria-current={childActive ? "page" : undefined}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                childActive
                                  ? "bg-surface-muted text-foreground"
                                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* View Website link */}
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-4 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate">View Website</span>}
      </Link>
    </nav>
  );
}

// ── Sign-out button ──────────────────────────────────────

function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Sign out</span>
      </button>
    </form>
  );
}

// ── Notification bell ────────────────────────────────────

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-[18px] items-center justify-center rounded-full bg-[oklch(0.355_0.074_159)] px-1 text-[10px] font-bold leading-4 text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

// ── User avatar and dropdown ─────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {initials}
    </div>
  );
}

function UserDropdown({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-sm font-semibold leading-tight text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <ChevronDown
          className={`hidden h-4 w-4 text-muted-foreground transition-transform md:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-lg"
          role="menu"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              role="menuitem"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Collapse toggle ──────────────────────────────────────

function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      ) : (
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

// ── DashboardLayout ──────────────────────────────────────

export function DashboardLayout({
  children,
  userName,
  userEmail,
  unreadCount,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  unreadCount: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(collapseStorageKey()) === "true";
  });

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem(collapseStorageKey(), String(next));
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-300 md:sticky ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-4 sm:py-6">
          <DashboardSidebar
            collapsed={collapsed}
            onNavClick={() => setSidebarOpen(false)}
            onToggle={toggleCollapse}
          />
        </div>
        <div className="border-t border-border p-2 sm:p-4">
          {collapsed ? (
            <Tooltip label="Sign out">
              <SignOutButton />
            </Tooltip>
          ) : (
            <SignOutButton />
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-surface-muted"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>
            <Link href="/dashboard" className="flex items-center" aria-label="Dashboard">
              <BrandMark />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell unreadCount={unreadCount} />
            <UserAvatar name={userName} />
          </div>
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur md:flex md:items-center md:justify-between md:px-8 md:py-3">
          <div />
          <div className="flex items-center gap-4">
            <NotificationBell unreadCount={unreadCount} />
            <UserDropdown name={userName} email={userEmail} />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 sm:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
