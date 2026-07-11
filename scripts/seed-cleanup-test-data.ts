/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const prefix = "CLN-TEST";

  // Clean up any previous test data first
  console.log("Cleaning up previous test data...");
  // Delete child records first (FK-safe order)
  await sql`DELETE FROM chat_messages WHERE content LIKE ${prefix + "%"}`;
  await sql`DELETE FROM chat_tool_events WHERE summary LIKE ${prefix + "%"}`;
  // Delete orphaned conversations whose children were just removed
  await sql`
    DELETE FROM chat_conversations cc
    WHERE NOT EXISTS (
      SELECT 1 FROM chat_messages cm WHERE cm.conversation_id = cc.id
    )
    AND created_at < NOW()
  `;
  await sql`DELETE FROM notifications WHERE title LIKE ${prefix + "%"}`;
  await sql`DELETE FROM activity_log WHERE summary LIKE ${prefix + "%"}`;
  await sql`DELETE FROM notifications WHERE title LIKE ${prefix + "%"}`;
  await sql`DELETE FROM activity_log WHERE summary LIKE ${prefix + "%"}`;

  // Find an admin user
  const [adminUser] = await sql`SELECT id, name, email FROM users ORDER BY created_at LIMIT 1`;
  if (!adminUser) {
    console.error("No users found. Run bootstrap-owner first.");
    process.exit(1);
  }
  console.log(`Using admin: ${adminUser.name} (${adminUser.email})`);

  // Find a client for conversations
  const [testClient] = await sql`SELECT id FROM clients LIMIT 1`;
  if (!testClient) {
    console.error("No clients found. Run seed-phase2 or seed-realistic-data first.");
    process.exit(1);
  }

  const now = new Date();
  let totalConvs = 0;
  let totalMsgs = 0;
  let totalEvents = 0;

  // ── 1. Chat conversations with messages ─────────────────────────────────
  console.log("\n--- Chat Conversations ---");
  for (let i = 1; i <= 3; i++) {
    const convTime = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);

    const [conv] = await sql`
      INSERT INTO chat_conversations (id, client_id, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${testClient.id}, 'closed', ${convTime}, ${convTime})
      RETURNING id
    `;
    totalConvs++;

    // Add messages
    for (let m = 1; m <= 2; m++) {
      const msgTime = new Date(convTime.getTime() + m * 5 * 60 * 1000);
      await sql`
        INSERT INTO chat_messages (id, conversation_id, role, content, created_at)
        VALUES (gen_random_uuid(), ${conv.id},
          ${m % 2 === 0 ? "assistant" : "user"},
          ${`${prefix}: Test message ${m} from conversation ${i}`},
          ${msgTime})
      `;
      totalMsgs++;
    }

    // Add a tool event
    await sql`
      INSERT INTO chat_tool_events (id, conversation_id, tool_name, status, summary, created_at)
      VALUES (gen_random_uuid(), ${conv.id}, 'check_availability', 'success',
        ${`${prefix}: Checked availability for conversation ${i}`}, ${convTime})
    `;
    totalEvents++;

    console.log(`  Created conversation ${i} (2 messages + 1 tool event)`);
  }

  // ── 2. Notifications ────────────────────────────────────────────────────
  console.log("\n--- Notifications ---");
  const notifTypes = ["booking.created", "payment.recorded", "follow_up.due"];
  for (let i = 0; i < notifTypes.length; i++) {
    const notifTime = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO notifications (id, user_id, type, title, summary, entity_type, created_at)
      VALUES (gen_random_uuid(), ${adminUser.id}, ${notifTypes[i]},
        ${`${prefix}: ${notifTypes[i].replace(".", " ")}`},
        ${`${prefix}: Test notification ${i + 1}`}, 'booking', ${notifTime})
    `;
    console.log(`  Created notification: ${notifTypes[i]}`);
  }

  // ── 3. Activity log entries ─────────────────────────────────────────────
  console.log("\n--- Activity Log Entries ---");
  const activityActions = [
    { action: "booking.created", summary: `${prefix}: Website booking request created` },
    { action: "booking.status.confirmed", summary: `${prefix}: Booking confirmed by admin` },
    { action: "invoice.issued", summary: `${prefix}: Invoice issued for completed service` },
    { action: "client.updated", summary: `${prefix}: Client contact details updated` },
    { action: "follow_up.completed", summary: `${prefix}: Follow-up call completed` },
  ];
  for (let i = 0; i < activityActions.length; i++) {
    const actTime = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, summary, created_at)
      VALUES (gen_random_uuid(), ${adminUser.id}, ${activityActions[i].action},
        'booking', gen_random_uuid(), ${activityActions[i].summary}, ${actTime})
    `;
    console.log(`  Created activity: ${activityActions[i].action}`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n=== SEED COMPLETE ===");
  console.log(`  Chat conversations: ${totalConvs}`);
  console.log(`  Chat messages: ${totalMsgs}`);
  console.log(`  Chat tool events: ${totalEvents}`);
  console.log(`  Notifications: ${notifTypes.length}`);
  console.log(`  Activity log entries: ${activityActions.length}`);
  console.log(`\nTotal records seeded: ${totalConvs + totalMsgs + totalEvents + notifTypes.length + activityActions.length}`);
  console.log("Test data prefix: CLN-TEST (can be used to identify test records)");

  await sql.end();
}

main()
  .catch((err) => {
    console.error("ERROR:", err);
    process.exit(1);
  });
