"use server";

import { sql, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireOwner } from "@/auth/session";
import { cleanupRuns } from "@/db/schema";
import { recordActivity } from "@/activity-log/record";

export type ActivityCleanupPreview = {
  models: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  total: number;
};

export type ActivityCleanupExportResult = {
  ok: true;
  runId: string;
  cutoffAt: string;
  exportedCounts: Record<string, number>;
  workbook: Buffer;
} | {
  ok: false;
  error: string;
};

export type ActivityCleanupExecuteResult = {
  ok: true;
  deleted: Record<string, number>;
  total: number;
} | {
  ok: false;
  error: string;
};

const MODEL_DEFS = [
  { key: "chatMessages", label: "Chat Messages", table: "chat_messages" },
  { key: "chatToolEvents", label: "Chat Tool Events", table: "chat_tool_events" },
  { key: "chatConversations", label: "Chat Conversations", table: "chat_conversations" },
  { key: "notifications", label: "Notifications", table: "notifications" },
  { key: "activityLog", label: "Activity Log Entries", table: "activity_log" },
] as const;

async function tableCountRaw(tableName: string, cutoffAt?: Date): Promise<number> {
  const db = getDb();
  if (cutoffAt) {
    const result = await db.execute(sql<{ count: number }>`
      select count(*)::int as count from ${sql.identifier(tableName)}
      where ${sql.identifier("created_at")} <= ${cutoffAt}
    `);
    return Number(result[0]?.count ?? 0);
  }
  const result = await db.execute(sql<{ count: number }>`
    select count(*)::int as count from ${sql.identifier(tableName)}
  `);
  return Number(result[0]?.count ?? 0);
}

export async function getCleanupPreview(): Promise<ActivityCleanupPreview> {
  await requireOwner();
  const counts: Record<string, number> = {};

  for (const model of MODEL_DEFS) {
    counts[model.key] = await tableCountRaw(model.table);
  }

  return {
    models: MODEL_DEFS.map((m) => ({
      key: m.key,
      label: m.label,
      count: counts[m.key] ?? 0,
    })),
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  };
}

const PRESERVED_SUMMARY = [
  "Services, categories, FAQs, screening questions, predefined items",
  "Public site content (policies, FAQs)",
  "Site settings (business, communication, booking rules, document sequences)",
  "Uploaded media (images stored in R2)",
  "Admin accounts (users, roles, permissions, sessions)",
  "Financial records (bookings, invoices, payments, receipts, quotations, unified documents)",
];

async function deleteWithCount(tableName: string, cutoffAt: Date): Promise<number> {
  const db = getDb();
  const result = await db.execute(sql<{ id: string }>`
    delete from ${sql.identifier(tableName)}
    where ${sql.identifier("created_at")} <= ${cutoffAt}
    returning id
  `);
  return result.length;
}

export async function exportCleanup(): Promise<ActivityCleanupExportResult> {
  const user = await requireOwner();
  const db = getDb();

  const cutoffAt = new Date();
  const expiresAt = new Date(cutoffAt.getTime() + 30 * 60 * 1000);

  try {
    // Build the Excel workbook first
    const XLSX = await import("xlsx");

    // Fetch all data for the workbook
    const allData: Array<{ key: string; label: string; rows: Record<string, unknown>[] }> = [];
    const exportedCounts: Record<string, number> = {};

    for (const model of MODEL_DEFS) {
      const rows = await db.execute(sql`
        select * from ${sql.identifier(model.table)}
        where ${sql.identifier("created_at")} <= ${cutoffAt}
        order by ${sql.identifier("created_at")} desc
      `);
      const raw = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
      allData.push({ key: model.key, label: model.label, rows: raw });
      exportedCounts[model.key] = raw.length;
    }

    // Summary sheet
    const summaryData: unknown[][] = [
      ["Activity Cleanup Export"],
      [],
      ["Exported at:", cutoffAt.toISOString()],
      ["Exported by:", user.name],
      ["Cutoff timestamp:", cutoffAt.toISOString()],
      [],
      ["Model", "Count"],
      ...MODEL_DEFS.map((m) => [m.label, exportedCounts[m.key] ?? 0]),
      [],
      ["Total", Object.values(exportedCounts).reduce((a, b) => a + b, 0)],
      [],
      ["Preserved Data (not included in cleanup):"],
      ...PRESERVED_SUMMARY.map((item) => [`- ${item}`]),
    ];

    const wb = XLSX.utils.book_new();
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Data sheets
    for (const { key, rows } of allData) {
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const data = rows.map((row) =>
          headers.map((h) => {
            const val = row[h];
            if (val instanceof Date) return val.toISOString();
            if (typeof val === "object" && val !== null) return JSON.stringify(val);
            return String(val ?? "");
          }),
        );
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, sheet, key.slice(0, 31));
      } else {
        const sheet = XLSX.utils.aoa_to_sheet([["No records found"]]);
        XLSX.utils.book_append_sheet(wb, sheet, key.slice(0, 31));
      }
    }

    const workbook = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Now create the cleanup run record (workbook built successfully)
    const [run] = await db
      .insert(cleanupRuns)
      .values({
        userId: user.id,
        status: "exported",
        cutoffAt,
        exportedCounts,
        expiresAt,
      })
      .returning();

    return {
      ok: true,
      runId: run.id,
      cutoffAt: cutoffAt.toISOString(),
      exportedCounts,
      workbook,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Export failed." };
  }
}

export async function executeCleanup(
  runId: string,
  confirmation: string,
): Promise<ActivityCleanupExecuteResult> {
  const user = await requireOwner();
  const db = getDb();

  if (confirmation !== "RESET ALL ACTIVITY") {
    return { ok: false, error: "Type RESET ALL ACTIVITY to confirm." };
  }

  const [run] = await db
    .select()
    .from(cleanupRuns)
    .where(eq(cleanupRuns.id, runId))
    .limit(1);

  if (!run) {
    return { ok: false, error: "Cleanup run not found. Please export first." };
  }

  if (run.userId !== user.id) {
    return { ok: false, error: "This export was created by another administrator. Please export your own." };
  }

  if (run.status !== "exported") {
    if (run.status === "completed") {
      return { ok: false, error: "This cleanup run has already been used." };
    }
    if (run.status === "expired") {
      return { ok: false, error: "This export has expired. Please export again." };
    }
    return { ok: false, error: `Cannot execute cleanup: run status is "${run.status}".` };
  }

  if (new Date() > run.expiresAt) {
    await db.update(cleanupRuns).set({ status: "expired" }).where(eq(cleanupRuns.id, runId));
    return { ok: false, error: "This export has expired (30 minute limit). Please export again." };
  }

  const cutoffAt = run.cutoffAt;
  const deleted: Record<string, number> = {};

  try {
    await db.transaction(async (tx) => {
      // Delete children first: chat_messages (child of chat_conversations)
      deleted.chatMessages = (await tx.execute(sql<{ id: string }>`
        delete from chat_messages
        where conversation_id in (
          select id from chat_conversations where created_at <= ${cutoffAt}
        )
        and created_at <= ${cutoffAt}
        returning id
      `)).length;

      // chat_tool_events (child of chat_conversations)
      deleted.chatToolEvents = (await tx.execute(sql<{ id: string }>`
        delete from chat_tool_events
        where conversation_id in (
          select id from chat_conversations where created_at <= ${cutoffAt}
        )
        and created_at <= ${cutoffAt}
        returning id
      `)).length;

      // chat_conversations
      deleted.chatConversations = (await tx.execute(sql<{ id: string }>`
        delete from chat_conversations
        where created_at <= ${cutoffAt}
        returning id
      `)).length;

      // notifications
      deleted.notifications = (await tx.execute(sql<{ id: string }>`
        delete from notifications
        where created_at <= ${cutoffAt}
        returning id
      `)).length;

      // activity_log
      deleted.activityLog = (await tx.execute(sql<{ id: string }>`
        delete from activity_log
        where created_at <= ${cutoffAt}
        returning id
      `)).length;
    });

    const total = Object.values(deleted).reduce((a, b) => a + b, 0);

    // Update the cleanup run
    await db
      .update(cleanupRuns)
      .set({
        status: "completed",
        deletedCounts: deleted,
        completedAt: new Date(),
      })
      .where(eq(cleanupRuns.id, runId));

    // Revalidate dashboard and related pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings/activity-cleanup");
    revalidatePath("/dashboard/activity-log");
    revalidatePath("/dashboard/notifications");

    // Record activity log entry (this is after cutoff, so it won't be deleted)
    await recordActivity(
      user.id,
      "activity_cleanup",
      "cleanup_run",
      runId,
      `Activity cleanup completed: ${total} records deleted`,
      { runId, cutoffAt: cutoffAt.toISOString(), deleted },
    );

    return { ok: true, deleted, total };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cleanup failed. Transaction rolled back." };
  }
}
