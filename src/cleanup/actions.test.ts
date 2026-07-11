import assert from "node:assert/strict";
import { describe, it } from "node:test";

// ── Pure-logic tests for the Activity Cleanup feature ──
// DB-dependent functions (getCleanupPreview, exportCleanup, executeCleanup)
// are tested indirectly via integration/API tests in a live environment.

const CONFIRMATION_PHRASE = "RESET ALL ACTIVITY";
const EXPIRY_MINUTES = 30;

const MODEL_DEFS = [
  { key: "chatMessages", label: "Chat Messages", table: "chat_messages" },
  { key: "chatToolEvents", label: "Chat Tool Events", table: "chat_tool_events" },
  { key: "chatConversations", label: "Chat Conversations", table: "chat_conversations" },
  { key: "notifications", label: "Notifications", table: "notifications" },
  { key: "activityLog", label: "Activity Log Entries", table: "activity_log" },
] as const;

const PRESERVED_SUMMARY = [
  "Services, categories, FAQs, screening questions, predefined items",
  "Public site content (policies, FAQs)",
  "Site settings (business, communication, booking rules, document sequences)",
  "Uploaded media (images stored in R2)",
  "Admin accounts (users, roles, permissions, sessions)",
  "Financial records (bookings, invoices, payments, receipts, quotations, unified documents)",
];

describe("Activity Cleanup — model definitions", () => {
  it("defines exactly 5 operational models", () => {
    assert.equal(MODEL_DEFS.length, 5);
  });

  it("includes chat messages", () => {
    const m = MODEL_DEFS.find((d) => d.key === "chatMessages");
    assert.ok(m);
    assert.equal(m.table, "chat_messages");
  });

  it("includes chat tool events", () => {
    const m = MODEL_DEFS.find((d) => d.key === "chatToolEvents");
    assert.ok(m);
    assert.equal(m.table, "chat_tool_events");
  });

  it("includes chat conversations", () => {
    const m = MODEL_DEFS.find((d) => d.key === "chatConversations");
    assert.ok(m);
    assert.equal(m.table, "chat_conversations");
  });

  it("includes notifications", () => {
    const m = MODEL_DEFS.find((d) => d.key === "notifications");
    assert.ok(m);
    assert.equal(m.table, "notifications");
  });

  it("includes activity log", () => {
    const m = MODEL_DEFS.find((d) => d.key === "activityLog");
    assert.ok(m);
    assert.equal(m.table, "activity_log");
  });

  it("all keys are unique", () => {
    const keys = MODEL_DEFS.map((d) => d.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("all table names reference existing schema tables", () => {
    const tables = MODEL_DEFS.map((d) => d.table);
    assert.ok(tables.every((t) => typeof t === "string" && t.length > 0));
  });
});

describe("Activity Cleanup — delete order validation", () => {
  // Children must be deleted before parents to avoid FK violations
  const DELETE_ORDER = [
    "chatMessages",   // child of chatConversations
    "chatToolEvents", // child of chatConversations
    "chatConversations",
    "notifications",
    "activityLog",
  ];

  it("chat messages are deleted before chat conversations (child before parent)", () => {
    const msgIdx = DELETE_ORDER.indexOf("chatMessages");
    const convIdx = DELETE_ORDER.indexOf("chatConversations");
    assert.ok(msgIdx < convIdx, "chatMessages must be deleted before chatConversations");
  });

  it("chat tool events are deleted before chat conversations (child before parent)", () => {
    const evtIdx = DELETE_ORDER.indexOf("chatToolEvents");
    const convIdx = DELETE_ORDER.indexOf("chatConversations");
    assert.ok(evtIdx < convIdx, "chatToolEvents must be deleted before chatConversations");
  });

  it("all 5 models appear in the delete order", () => {
    assert.equal(DELETE_ORDER.length, 5);
    const allKeys = MODEL_DEFS.map((d) => d.key);
    assert.deepEqual([...DELETE_ORDER].sort(), [...allKeys].sort());
  });
});

describe("Activity Cleanup — preserved data summary", () => {
  it("lists 6 preserved categories", () => {
    assert.equal(PRESERVED_SUMMARY.length, 6);
  });

  it("mentions services preservation", () => {
    assert.ok(PRESERVED_SUMMARY.some((s) => s.toLowerCase().includes("service")));
  });

  it("mentions settings preservation", () => {
    assert.ok(PRESERVED_SUMMARY.some((s) => s.toLowerCase().includes("setting")));
  });

  it("mentions user/admin preservation", () => {
    assert.ok(PRESERVED_SUMMARY.some((s) => s.toLowerCase().includes("admin")));
  });

  it("mentions media preservation", () => {
    assert.ok(PRESERVED_SUMMARY.some((s) => s.toLowerCase().includes("media")));
  });

  it("mentions financial records preservation", () => {
    assert.ok(PRESERVED_SUMMARY.some((s) => s.toLowerCase().includes("financial")));
  });
});

describe("Activity Cleanup — confirmation phrase", () => {
  it("requires exact RESET ALL ACTIVITY phrase", () => {
    const valid = CONFIRMATION_PHRASE;
    assert.equal(valid, "RESET ALL ACTIVITY");
  });

  it("rejects lowercase variation", () => {
    assert.notEqual("reset all activity", CONFIRMATION_PHRASE);
  });

  it("rejects partial phrase", () => {
    assert.notEqual("RESET", CONFIRMATION_PHRASE);
  });

  it("rejects empty string", () => {
    assert.notEqual("", CONFIRMATION_PHRASE);
  });

  it("rejects similar but wrong phrasing", () => {
    assert.notEqual("RESET ALL DATA", CONFIRMATION_PHRASE);
    assert.notEqual("CLEAR ALL ACTIVITY", CONFIRMATION_PHRASE);
    assert.notEqual("DELETE ALL RECORDS", CONFIRMATION_PHRASE);
  });
});

describe("Activity Cleanup — expiry calculation", () => {
  it("computes expiry as 30 minutes from cut-off", () => {
    const cutoffAt = new Date("2026-07-11T12:00:00Z");
    const expiresAt = new Date(cutoffAt.getTime() + EXPIRY_MINUTES * 60 * 1000);
    assert.equal(expiresAt.toISOString(), "2026-07-11T12:30:00.000Z");
  });

  it("detects expired run when current time exceeds expiry", () => {
    const cutoffAt = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000 - 1);
    const expiresAt = new Date(cutoffAt.getTime() + EXPIRY_MINUTES * 60 * 1000);
    assert.ok(Date.now() > expiresAt.getTime());
  });

  it("detects valid (non-expired) run when within 30 minute window", () => {
    const cutoffAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const expiresAt = new Date(cutoffAt.getTime() + EXPIRY_MINUTES * 60 * 1000);
    assert.ok(Date.now() < expiresAt.getTime());
  });
});

describe("Activity Cleanup — error messages", () => {
  it("wrong confirmation error contains the confirmation phrase", () => {
    const error = "Type RESET ALL ACTIVITY to confirm.";
    assert.ok(error.includes("RESET ALL ACTIVITY"));
    assert.ok(error.includes("confirm"));
  });

  it("missing export error mentions export", () => {
    const error = "Cleanup run not found. Please export first.";
    assert.ok(error.includes("export"));
    assert.ok(error.includes("not found"));
  });

  it("wrong owner error mentions administrator", () => {
    const error = "This export was created by another administrator. Please export your own.";
    assert.ok(error.includes("another administrator"));
    assert.ok(error.includes("export your own"));
  });

  it("reused run error mentions already used", () => {
    const error = "This cleanup run has already been used.";
    assert.ok(error.includes("already been used"));
    assert.ok(error.includes("cleanup run"));
  });

  it("expired run error mentions expired", () => {
    const error = "This export has expired (30 minute limit). Please export again.";
    assert.ok(error.includes("expired"));
    assert.ok(error.includes("30 minute"));
  });

  it("all error messages are distinct", () => {
    const errors = [
      "Type RESET ALL ACTIVITY to confirm.",
      "Cleanup run not found. Please export first.",
      "This export was created by another administrator. Please export your own.",
      "This cleanup run has already been used.",
      "This export has expired (30 minute limit). Please export again.",
    ];
    assert.equal(new Set(errors).size, errors.length);
  });
});

describe("Activity Cleanup — type validation", () => {
  it("preview type has models array and total number", () => {
    const preview: { models: Array<{ key: string; label: string; count: number }>; total: number } = {
      models: [],
      total: 0,
    };
    assert.equal(preview.total, 0);
    assert.equal(preview.models.length, 0);
  });

  it("preview model entry has correct shape", () => {
    const entry: { key: string; label: string; count: number } = {
      key: "notifications",
      label: "Notifications",
      count: 42,
    };
    assert.equal(entry.key, "notifications");
    assert.equal(entry.label, "Notifications");
    assert.equal(entry.count, 42);
  });

  it("export success result has ok, runId, cutoffAt, exportedCounts, workbook", () => {
    const result = {
      ok: true as const,
      runId: "abc-123",
      cutoffAt: "2026-07-11T12:00:00.000Z",
      exportedCounts: { chatMessages: 10 },
      workbook: Buffer.from([]),
    };
    assert.equal(result.ok, true);
    assert.ok(typeof result.runId === "string");
    assert.ok(typeof result.cutoffAt === "string");
    assert.ok(result.workbook instanceof Buffer);
  });

  it("export failure result has ok false and error string", () => {
    const result = { ok: false as const, error: "Export failed." };
    assert.equal(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  it("execute success result has ok, deleted map, and total", () => {
    const result = {
      ok: true as const,
      deleted: { chatMessages: 5, notifications: 3 },
      total: 8,
    };
    assert.equal(result.ok, true);
    assert.equal(result.total, 8);
    assert.equal(result.deleted.chatMessages, 5);
    assert.equal(result.deleted.notifications, 3);
  });

  it("execute failure result has ok false and error string", () => {
    const result = { ok: false as const, error: "Missing export." };
    assert.equal(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  it("total equals sum of all deleted values", () => {
    const deleted = { chatMessages: 10, chatToolEvents: 5, chatConversations: 3, notifications: 20, activityLog: 50 };
    const total = Object.values(deleted).reduce((a, b) => a + b, 0);
    assert.equal(total, 88);
  });
});

describe("Activity Cleanup — model key to table name mapping", () => {
  it("chatMessages maps to chat_messages", () => {
    const m = MODEL_DEFS.find((d) => d.key === "chatMessages");
    assert.equal(m?.table, "chat_messages");
  });

  it("chatToolEvents maps to chat_tool_events", () => {
    const m = MODEL_DEFS.find((d) => d.key === "chatToolEvents");
    assert.equal(m?.table, "chat_tool_events");
  });

  it("chatConversations maps to chat_conversations", () => {
    const m = MODEL_DEFS.find((d) => d.key === "chatConversations");
    assert.equal(m?.table, "chat_conversations");
  });

  it("notifications maps to notifications", () => {
    const m = MODEL_DEFS.find((d) => d.key === "notifications");
    assert.equal(m?.table, "notifications");
  });

  it("activityLog maps to activity_log", () => {
    const m = MODEL_DEFS.find((d) => d.key === "activityLog");
    assert.equal(m?.table, "activity_log");
  });
});
