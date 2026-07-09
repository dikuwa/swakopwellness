"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, Trash2, Loader2, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { markNotificationRead, markAllAsRead, clearReadNotifications } from "./actions";

interface Notification {
  id: string;
  title: string;
  summary: string;
  type: string;
  createdAt: Date;
  readAt: Date | null;
}

export function NotificationList({ items }: { items: Notification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clearing, setClearing] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const hasUnread = items.some((n) => !n.readAt);
  const hasRead = items.some((n) => n.readAt);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await markNotificationRead(id);
      toast.success("Marked as read");
      router.refresh();
    } catch {
      toast.error("Failed to mark as read");
    }
    setMarkingId(null);
  };

  const handleMarkAllRead = async () => {
    startTransition(async () => {
      try {
        await markAllAsRead();
        toast.success("All notifications marked as read");
        router.refresh();
      } catch {
        toast.error("Failed to mark all as read");
      }
    });
  };

  const handleClearRead = async () => {
    setClearing(true);
    try {
      await clearReadNotifications();
      toast.success("Cleared read notifications");
      router.refresh();
    } catch {
      toast.error("Failed to clear notifications");
    }
    setClearing(false);
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-3">
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            )}
            Mark all as read
          </button>
        )}
        {hasRead && (
          <button
            type="button"
            onClick={handleClearRead}
            disabled={clearing}
            className="flex h-10 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Clear read
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No notifications yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Notifications will appear here when bookings are created, follow-ups are due, and other events occur.
          </p>
        </div>
      )}

      {/* Notification list */}
      {items.length > 0 && (
        <div className="divide-y divide-border rounded-2xl border border-border">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                !n.readAt ? "bg-primary/[0.02]" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!n.readAt && (
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[oklch(0.55_0.20_36)]" />
                  )}
                  <p
                    className={`text-sm ${
                      n.readAt ? "text-foreground" : "font-semibold text-foreground"
                    }`}
                  >
                    {n.title}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.summary}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{n.type.replaceAll("_", " ")}</span>
                  <span>
                    {new Date(n.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markingId === n.id}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Mark as read"
                >
                  {markingId === n.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              )}
              {n.readAt && (
                <span className="shrink-0 text-xs text-muted-foreground/60 pt-1">Read</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
