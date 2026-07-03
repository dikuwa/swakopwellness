import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasPermission } from "@/auth/permissions";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../../actions";
import { getDashboardChatConversationById } from "@/dashboard/data";
import { updateChatConversationStatus } from "../actions";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{status.replaceAll("_", " ")}</span>;
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

export default async function ChatConversationDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("bookings:view");
  const { id } = await props.params;
  const conversation = await getDashboardChatConversationById(id);

  if (!conversation) notFound();

  const nextStatus = conversation.status === "closed" ? "open" : "closed";
  const canUpdateStatus = hasPermission(user.permissions, "bookings:update");

  return (
    <DashboardShell>
      <Link href="/dashboard/chat-conversations" className="text-sm text-muted-foreground hover:text-foreground">&larr; Chat conversations</Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Chat conversation</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{conversation.clientName ?? "Unknown client"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Updated {conversation.updatedAt.toLocaleString("en-NA")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={conversation.status} />
            {canUpdateStatus ? (
              <form action={async (formData) => { "use server"; await updateChatConversationStatus(formData); }}>
                <input type="hidden" name="conversationId" value={conversation.id} />
                <input type="hidden" name="status" value={nextStatus} />
                <button type="submit" className="h-10 rounded-xl border border-border px-3 text-sm font-semibold capitalize hover:bg-surface-muted">
                  {nextStatus === "closed" ? "Close" : "Reopen"}
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Created" value={conversation.createdAt.toLocaleString("en-NA")} />
          <DetailItem label="Updated" value={conversation.updatedAt.toLocaleString("en-NA")} />
          <DetailItem
            label="Linked booking"
            value={conversation.bookingId && conversation.bookingReference ? <Link href={`/dashboard/bookings/${conversation.bookingId}`} className="text-primary hover:underline">{conversation.bookingReference}</Link> : "None"}
          />
          <DetailItem label="Booking status" value={conversation.bookingStatus ? <span className="capitalize">{conversation.bookingStatus.replaceAll("_", " ")}</span> : "None"} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Linked Client</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Name" value={conversation.clientId && conversation.clientName ? <Link href={`/dashboard/clients/${conversation.clientId}`} className="text-primary hover:underline">{conversation.clientName}</Link> : "Unknown"} />
              <DetailItem label="Phone" value={conversation.clientPhone ?? "None"} />
              <DetailItem label="Email" value={conversation.clientEmail ?? "None"} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Tool Events</h2>
            {conversation.toolEvents.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No tool events recorded.</p> : null}
            <div className="mt-4 space-y-3">
              {conversation.toolEvents.map((event) => (
                <div key={event.id} className="rounded-xl bg-surface-muted p-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-medium">{event.toolName}</p>
                    <span className="text-xs font-semibold capitalize text-muted-foreground">{event.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{event.createdAt.toLocaleString("en-NA")}</p>
                  {event.summary ? <p className="mt-2 text-muted-foreground">{event.summary}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold">Messages</h2>
          {conversation.messages.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No messages recorded.</p> : null}
          <div className="mt-4 space-y-3">
            {conversation.messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-border p-4 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-semibold capitalize">{message.role.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{message.createdAt.toLocaleString("en-NA")}</p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{message.content}</p>
              </div>
            ))}
          </div>
        </section>
    </DashboardShell>
  );
}
