import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDb } from "@/db/client";
import { bookings, chatConversations, clients } from "@/db/schema";
import { Pagination } from "@/ui/pagination";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  bot_active: "bg-green-100 text-green-700",
  human_active: "bg-primary/10 text-primary",
  closed: "bg-gray-100 text-gray-700",
  open: "bg-green-100 text-green-700",
  booking_requested: "bg-amber-100 text-amber-800",
  booking_failed: "bg-red-100 text-red-700",
  booking_started: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  new: "New",
  bot_active: "Bot active",
  human_active: "Human active",
  closed: "Closed",
  open: "Bot active",
  booking_requested: "New",
  booking_failed: "New",
  booking_started: "Bot active",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{statusLabels[status] ?? status.replaceAll("_", " ")}</span>;
}

export default async function ChatConversationsPage(props: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission("bookings:view");
  const { page: pageStr } = await props.searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const db = getDb();
  const [conversations, [{ count: total }]] = await Promise.all([
    db
      .select({
        id: chatConversations.id,
        status: chatConversations.status,
        createdAt: chatConversations.createdAt,
        updatedAt: chatConversations.updatedAt,
        bookingId: bookings.id,
        bookingReference: bookings.reference,
        clientId: clients.id,
        clientName: clients.fullName,
      })
      .from(chatConversations)
      .leftJoin(bookings, eq(chatConversations.bookingId, bookings.id))
      .leftJoin(clients, eq(chatConversations.clientId, clients.id))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(chatConversations),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <DashboardShell>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">Chat Conversations</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review chatbot conversations, linked bookings and client details.</p>

        {conversations.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No chat conversations recorded yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id} className="border-t border-border">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <Link href={`/dashboard/chat-conversations/${conversation.id}`} className="hover:text-primary">
                        <StatusBadge status={conversation.status} />
                      </Link>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {conversation.bookingId && conversation.bookingReference ? (
                        <Link href={`/dashboard/bookings/${conversation.bookingId}`} className="font-medium hover:text-primary">{conversation.bookingReference}</Link>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {conversation.clientId && conversation.clientName ? (
                        <Link href={`/dashboard/clients/${conversation.clientId}`} className="hover:text-primary">{conversation.clientName}</Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">{conversation.createdAt.toLocaleString("en-GB")}</td>
                    <td className="py-3 whitespace-nowrap text-muted-foreground">{conversation.updatedAt.toLocaleString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/chat-conversations" />
    </DashboardShell>
  );
}
