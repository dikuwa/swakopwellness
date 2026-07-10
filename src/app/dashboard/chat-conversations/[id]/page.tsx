import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Bot, User } from "lucide-react";
import { hasPermission } from "@/auth/permissions";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDashboardChatConversationById } from "@/dashboard/data";
import { PendingSubmitButton } from "@/app/dashboard/pending-submit-button";
import { sendChatConversationReply, updateChatConversationStatus } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat Conversation — Dashboard",
};

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

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function renderMessageContent(content: string) {
  return content.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="break-words [overflow-wrap:anywhere]">{part.slice(2, -2)}</strong>;
    }
    return <span key={index} className="break-words [overflow-wrap:anywhere]">{part}</span>;
  });
}

function expandLegacyTranscript(role: string, content: string, createdAt: Date) {
  const lines = content.split("\n");
  const hasTranscriptMarkers = lines.some((line) => /^(assistant|user):\s*/i.test(line));
  if (!hasTranscriptMarkers) return [{ role, content, createdAt }];

  const messages: { role: string; content: string; createdAt: Date }[] = [];
  for (const line of lines) {
    const match = /^(assistant|user):\s*(.*)$/i.exec(line);
    if (match) {
      messages.push({ role: match[1].toLowerCase(), content: match[2].trim(), createdAt });
    } else if (messages.length > 0) {
      messages[messages.length - 1].content += `\n${line}`;
    }
  }
  return messages.filter((message) => message.content.trim());
}

function ChatMessage({ role, content, createdAt }: { role: string; content: string; createdAt: Date }) {
  const isUser = role === "user";
  const roleLabel = isUser ? "Client" : "Assistant";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser
          ? "bg-primary/10"
          : "bg-surface-muted"
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-primary" aria-hidden="true" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex min-w-0 max-w-[75%] flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      }`}>
        <span className="text-[11px] font-medium text-muted-foreground">
          {roleLabel}
        </span>
        <div className={`min-w-0 break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${
          isUser
            ? "bg-primary/10 text-foreground rounded-tr-md"
            : "bg-surface-muted text-foreground rounded-tl-md"
        }`}>
          {renderMessageContent(content)}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {createdAt.toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}

export default async function ChatConversationDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("bookings:view");
  const { id } = await props.params;
  const conversation = await getDashboardChatConversationById(id);

  if (!conversation) notFound();

  const isClosed = conversation.status === "closed";
  const isHumanActive = conversation.status === "human_active";
  const canUpdateStatus = hasPermission(user.permissions, "bookings:update");

  return (
    <DashboardShell>
      <Link href="/dashboard/chat-conversations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Chat conversations</Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Chat conversation</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{conversation.clientName ?? "Unknown client"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Updated {conversation.updatedAt.toLocaleString("en-GB")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={conversation.status} />
          {canUpdateStatus ? (
            <>
              {!isClosed ? (
                <form action={async (formData) => { "use server"; await updateChatConversationStatus(formData); }}>
                  <input type="hidden" name="conversationId" value={conversation.id} />
                  <input type="hidden" name="status" value={isHumanActive ? "bot_active" : "human_active"} />
                  <PendingSubmitButton
                    pendingChildren={isHumanActive ? "Returning..." : "Taking over..."}
                    className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted transition-colors"
                  >
                    {isHumanActive ? "Return to bot" : "Take over"}
                  </PendingSubmitButton>
                </form>
              ) : null}
              <form action={async (formData) => { "use server"; await updateChatConversationStatus(formData); }}>
                <input type="hidden" name="conversationId" value={conversation.id} />
                <input type="hidden" name="status" value={isClosed ? "bot_active" : "closed"} />
                <PendingSubmitButton
                  pendingChildren={isClosed ? "Reopening..." : "Closing..."}
                  className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted transition-colors"
                >
                  {isClosed ? "Reopen" : "Close"}
                </PendingSubmitButton>
              </form>
            </>
          ) : null}
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Created</p>
          <p className="mt-1 text-sm font-medium">{conversation.createdAt.toLocaleString("en-GB")}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Updated</p>
          <p className="mt-1 text-sm font-medium">{conversation.updatedAt.toLocaleString("en-GB")}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Linked booking</p>
          <p className="mt-1 text-sm font-medium">
            {conversation.bookingId && conversation.bookingReference ? (
              <Link href={`/dashboard/bookings/${conversation.bookingId}`} className="text-primary hover:underline">
                {conversation.bookingReference}
              </Link>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Booking status</p>
          <p className="mt-1 text-sm font-medium">
            {conversation.bookingStatus ? (
              <span className="capitalize">{conversation.bookingStatus.replaceAll("_", " ")}</span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-base font-semibold">Linked Client</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Name" value={
              conversation.clientId && conversation.clientName
                ? <Link href={`/dashboard/clients/${conversation.clientId}`} className="text-primary hover:underline">{conversation.clientName}</Link>
                : <span className="text-muted-foreground">Unknown</span>
            } />
            <DetailItem label="Phone" value={conversation.clientPhone ?? <span className="text-muted-foreground">Not provided</span>} />
            <DetailItem label="Email" value={conversation.clientEmail ?? <span className="text-muted-foreground">Not provided</span>} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-base font-semibold">Tool Events</h2>
          {conversation.toolEvents.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No tool events recorded.</p>
          ) : null}
          <div className="mt-4 space-y-2">
            {conversation.toolEvents.map((event) => (
              <div key={event.id} className="rounded-lg bg-surface-muted p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-xs">{event.toolName}</p>
                  <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded ${
                    event.status === "success" ? "bg-green-50 text-green-700" :
                    event.status === "error" ? "bg-red-50 text-red-700" :
                    "bg-gray-50 text-gray-700"
                  }`}>{event.status.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{event.createdAt.toLocaleString("en-GB")}</p>
                {event.summary ? <p className="mt-1.5 text-xs text-muted-foreground">{event.summary}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Messages */}
      <section className="mt-6 rounded-xl border border-border bg-background p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">Messages</h2>
          {conversation.status === "human_active" ? <p className="text-xs text-muted-foreground">Human takeover is active. The bot will not reply automatically.</p> : null}
        </div>
        {conversation.messages.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No messages recorded.</p>
        ) : (
          <div className="mt-5 space-y-5">
            {conversation.messages.flatMap((message) => expandLegacyTranscript(message.role, message.content, message.createdAt).map((item, index) => (
                <ChatMessage
                  key={`${message.id}-${index}`}
                  role={item.role}
                  content={item.content}
                  createdAt={item.createdAt}
                />
            )))}
          </div>
        )}
        {canUpdateStatus && !isClosed ? (
          <form action={async (formData) => { "use server"; await sendChatConversationReply(formData); }} className="mt-6 border-t border-border pt-5">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <label htmlFor="chat-reply" className="text-sm font-semibold">Reply to client</label>
            <textarea
              id="chat-reply"
              name="content"
              rows={4}
              required
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Type a warm, clear reply..."
            />
            <div className="mt-3 flex justify-end">
              <PendingSubmitButton pendingChildren="Sending..." className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Send reply
              </PendingSubmitButton>
            </div>
          </form>
        ) : null}
      </section>
    </DashboardShell>
  );
}
