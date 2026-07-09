"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  FileText,
  Loader2,
  ReceiptText,
  Trash2,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button } from "@/ui/components";
import { Modal } from "@/ui/modal";
import {
  clearReadNotifications,
  markAllAsRead,
  markNotificationRead,
  markNotificationUnread,
  removeNotification,
  resolveNotificationTarget,
} from "./actions";

interface Notification {
  id: string;
  title: string;
  summary: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
  readAt: Date | null;
}

type FilterKey = "all" | "unread" | "invoices" | "payments" | "quotes" | "bookings";

const filterConfig: Array<{ key: FilterKey; label: string; icon: typeof Bell }> = [
  { key: "all", label: "All", icon: Bell },
  { key: "unread", label: "Unread", icon: Check },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "payments", label: "Payments", icon: WalletCards },
  { key: "quotes", label: "Quotes", icon: ReceiptText },
  { key: "bookings", label: "Bookings", icon: CalendarCheck },
];

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replaceAll("-", "_");
}

function notificationCategory(notification: Notification): Exclude<FilterKey, "all" | "unread"> | "other" {
  const entity = normalize(notification.entityType);
  const type = normalize(notification.type);
  if (entity === "payment" || type.includes("payment")) return "payments";
  if (entity === "invoice" || type.includes("invoice")) return "invoices";
  if (entity === "quotation" || entity === "quote" || type.includes("quotation") || type.includes("quote")) return "quotes";
  if (entity === "booking" || type.includes("booking")) return "bookings";
  return "other";
}

function entityLabel(notification: Notification) {
  const entity = normalize(notification.entityType);
  if (entity === "payment") return "Payment";
  if (entity === "invoice") return "Invoice";
  if (entity === "quotation" || entity === "quote") return "Quotation";
  if (entity === "receipt") return "Receipt";
  if (entity === "booking") return "Booking";
  if (entity === "document") return "Document";
  if (entity === "client") return "Client";
  if (entity === "chat" || entity === "chat_conversation") return "Chat";
  if (entity === "follow_up" || entity === "followup") return "Follow-up";
  return notification.type.replaceAll("_", " ").replaceAll(".", " ");
}

function viewLabel(notification: Notification) {
  const label = entityLabel(notification);
  if (!notification.entityType || !notification.entityId) return "No linked item";
  if (label.length > 18) return "View item";
  return `View ${label.toLowerCase()}`;
}

function formattedDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(date: Date) {
  const diffSeconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (diffSeconds >= seconds) return formatter.format(-Math.floor(diffSeconds / seconds), unit);
  }
  return "just now";
}

function dateGroup(date: Date) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 24 * 60 * 60 * 1000;
  const value = new Date(date).getTime();
  if (value >= startToday) return "Today";
  if (value >= startYesterday) return "Yesterday";
  return "Earlier";
}

function amountFrom(notification: Notification) {
  const text = `${notification.title} ${notification.summary}`;
  const match = text.match(/N\$\s?[\d\s,.]+/i);
  return match?.[0].replace(/\s+/g, "") ?? null;
}

function statusFrom(notification: Notification) {
  const text = `${notification.type} ${notification.title} ${notification.summary}`.toLowerCase();
  if (text.includes("failed")) return { label: "Failed", variant: "danger" as const };
  if (text.includes("voided") || text.includes("cancelled")) return { label: "Action needed", variant: "warning" as const };
  if (text.includes("paid") || text.includes("confirmed") || text.includes("completed")) return { label: "Confirmed", variant: "success" as const };
  if (text.includes("created") || text.includes("recorded") || text.includes("issued")) return { label: "New", variant: "primary" as const };
  if (text.includes("updated") || text.includes("rescheduled")) return { label: "Updated", variant: "primary" as const };
  return null;
}

export function NotificationList({ items }: { items: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(items);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isMarkingAll, startMarkAllTransition] = useTransition();
  const [clearing, setClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [rowActionId, setRowActionId] = useState<string | null>(null);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return notifications.reduce(
      (acc, notification) => {
        acc.all += 1;
        if (!notification.readAt) acc.unread += 1;
        const category = notificationCategory(notification);
        if (category !== "other") acc[category] += 1;
        return acc;
      },
      { all: 0, unread: 0, invoices: 0, payments: 0, quotes: 0, bookings: 0 } satisfies Record<FilterKey, number>,
    );
  }, [notifications]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((notification) => !notification.readAt);
    return notifications.filter((notification) => notificationCategory(notification) === filter);
  }, [filter, notifications]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Array<{ group: string; items: Notification[] }>>((groups, notification) => {
      const group = dateGroup(notification.createdAt);
      const existing = groups.find((entry) => entry.group === group);
      if (existing) {
        existing.items.push(notification);
      } else {
        groups.push({ group, items: [notification] });
      }
      return groups;
    }, []);
  }, [filteredItems]);

  const hasUnread = counts.unread > 0;
  const hasRead = notifications.some((notification) => notification.readAt);

  const openNotification = async (notification: Notification) => {
    if (!notification.entityType || !notification.entityId || navigatingId || rowActionId) {
      if (!notification.entityType || !notification.entityId) toast.error("This notification is not linked to a record.");
      return;
    }

    setNavigatingId(notification.id);
    try {
      const result = await resolveNotificationTarget(notification.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, readAt: item.readAt ?? new Date() } : item)));
      router.push(result.href);
    } catch {
      toast.error("Could not open this notification.");
    } finally {
      setNavigatingId(null);
    }
  };

  const handleMarkReadToggle = async (notification: Notification) => {
    setRowActionId(notification.id);
    const previous = notifications;
    const nextReadAt = notification.readAt ? null : new Date();
    setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, readAt: nextReadAt } : item)));
    try {
      if (notification.readAt) {
        await markNotificationUnread(notification.id);
        toast.success("Marked as unread");
      } else {
        await markNotificationRead(notification.id);
        toast.success("Marked as read");
      }
      router.refresh();
    } catch {
      setNotifications(previous);
      toast.error(notification.readAt ? "Failed to mark as unread" : "Failed to mark as read");
    } finally {
      setRowActionId(null);
    }
  };

  const handleRemove = async (notification: Notification) => {
    setRowActionId(notification.id);
    const previous = notifications;
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    try {
      await removeNotification(notification.id);
      toast.success("Notification removed");
      router.refresh();
    } catch {
      setNotifications(previous);
      toast.error("Failed to remove notification");
    } finally {
      setRowActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const previous = notifications;
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt ?? new Date() })));
    startMarkAllTransition(async () => {
      try {
        await markAllAsRead();
        toast.success("All notifications marked as read");
        router.refresh();
      } catch {
        setNotifications(previous);
        toast.error("Failed to mark all as read");
      }
    });
  };

  const handleClearRead = async () => {
    setClearing(true);
    const previous = notifications;
    setNotifications((current) => current.filter((notification) => !notification.readAt));
    try {
      await clearReadNotifications();
      toast.success("Cleared read notifications");
      setConfirmClearOpen(false);
      router.refresh();
    } catch {
      setNotifications(previous);
      toast.error("Failed to clear notifications");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterConfig.map((option) => {
              const Icon = option.icon;
              const active = filter === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="h-4 w-4 opacity-70" aria-hidden="true" />
                  {option.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {counts[option.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleMarkAllRead} disabled={!hasUnread || isMarkingAll} className="gap-2">
              {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" /> : <CheckCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
              Mark all as read
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmClearOpen(true)} disabled={!hasRead || clearing} className="gap-2 text-destructive hover:bg-destructive/5">
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Clear read
            </Button>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings, payments, documents, and staff alerts will appear here.</p>
        </div>
      ) : null}

      {notifications.length > 0 && filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm font-semibold text-foreground">No notifications match this filter</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another category or clear read notifications after reviewing them.</p>
        </div>
      ) : null}

      {groupedItems.map((group) => (
        <section key={group.group} className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground">{group.group}</h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {group.items.map((notification) => {
              const unread = !notification.readAt;
              const amount = amountFrom(notification);
              const status = statusFrom(notification);
              const actionDisabled = rowActionId === notification.id || navigatingId === notification.id;
              const hasTarget = Boolean(notification.entityType && notification.entityId);

              return (
                <article
                  key={notification.id}
                  role={hasTarget ? "button" : undefined}
                  tabIndex={hasTarget ? 0 : undefined}
                  onClick={() => openNotification(notification)}
                  onKeyDown={(event) => {
                    if (!hasTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openNotification(notification);
                    }
                  }}
                  className={`border-t border-border px-4 py-2.5 outline-none first:border-t-0 transition-colors focus-visible:ring-3 focus-visible:ring-primary/10 sm:px-5 ${
                    hasTarget ? "cursor-pointer hover:bg-surface-muted/60" : ""
                  } ${unread ? "bg-primary/[0.035]" : "bg-surface"}`}
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start gap-1.5">
                        {unread ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                        <div className="min-w-0">
                          <p className={`text-[14px] leading-4 text-foreground ${unread ? "font-semibold" : "font-medium"}`}>{notification.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-[13px] leading-4 text-muted-foreground">{notification.summary}</p>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-3 text-[12px] leading-4 text-muted-foreground">
                        <span className="capitalize">{entityLabel(notification)}</span>
                        <span aria-hidden="true">•</span>
                        <time dateTime={new Date(notification.createdAt).toISOString()}>{formattedDate(notification.createdAt)}</time>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {amount ? <Badge variant="muted">{amount}</Badge> : null}
                        {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
                        <span className="text-[12px] text-muted-foreground">{relativeTime(notification.createdAt)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!hasTarget || actionDisabled}
                          onClick={(event) => {
                            event.stopPropagation();
                            openNotification(notification);
                          }}
                          className="h-6 min-w-0 gap-1 px-2 text-[11px]"
                        >
                          {navigatingId === notification.id ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
                          {viewLabel(notification)}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={actionDisabled}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMarkReadToggle(notification);
                          }}
                          className="h-7 px-1 text-[12px] text-muted-foreground"
                        >
                          {rowActionId === notification.id ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : null}
                          {notification.readAt ? "Unread" : "Read"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={actionDisabled}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemove(notification);
                          }}
                          className="h-7 px-1 text-[12px] text-destructive hover:bg-destructive/5"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <Modal isOpen={confirmClearOpen} onClose={() => (clearing ? undefined : setConfirmClearOpen(false))} title="Clear read notifications">
        <div className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            This removes read notifications from your dashboard. Unread notifications will stay visible.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setConfirmClearOpen(false)} disabled={clearing}>
              Keep notifications
            </Button>
            <Button type="button" variant="danger" onClick={handleClearRead} disabled={clearing} className="gap-2">
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Clear read
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
