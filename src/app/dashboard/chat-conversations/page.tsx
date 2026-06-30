import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getDashboardChatConversations } from "@/dashboard/data";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{status.replaceAll("_", " ")}</span>;
}

export default async function ChatConversationsPage() {
  await requirePermission("bookings:view");
  const conversations = await getDashboardChatConversations();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
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
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">{conversation.createdAt.toLocaleString("en-NA")}</td>
                    <td className="py-3 whitespace-nowrap text-muted-foreground">{conversation.updatedAt.toLocaleString("en-NA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
