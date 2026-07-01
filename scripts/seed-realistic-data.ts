/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % 36];
  }
  return result;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function main() {
  console.log("=== SEED REALISTIC DATA FOR SWAKOP WELLNESS CENTRE ===");

  // ── 1. DELETE TEST/GENERIC DATA ──────────────────────────────────────────
  console.log("\n[Step 1] Cleaning up test/generic data...");

  // Find test client IDs
  const testClients = await sql`
    SELECT id, full_name FROM clients
    WHERE full_name ILIKE '%test%' OR full_name ILIKE '%codex%' OR full_name ILIKE '%chat test%'
  `;
  const testClientIds = testClients.map((c: any) => c.id);
  const testClientNames = testClients.map((c: any) => c.full_name);
  console.log(`  Found ${testClientIds.length} test clients: ${testClientNames.join(", ") || "none"}`);

  if (testClientIds.length > 0) {
    // Find related booking IDs
    const testBookings = await sql`
      SELECT id, reference FROM bookings WHERE client_id = ANY(${testClientIds}::uuid[])
    `;
    const testBookingIds = testBookings.map((b: any) => b.id);
    console.log(`  Found ${testBookingIds.length} test bookings`);

    // Delete in dependency-safe order
    if (testBookingIds.length > 0) {
      await sql`DELETE FROM booking_answers WHERE booking_id = ANY(${testBookingIds}::uuid[])`;
      await sql`DELETE FROM booking_status_history WHERE booking_id = ANY(${testBookingIds}::uuid[])`;
      await sql`DELETE FROM chat_messages WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE booking_id = ANY(${testBookingIds}::uuid[]))`;
      await sql`DELETE FROM chat_tool_events WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE booking_id = ANY(${testBookingIds}::uuid[]))`;
      await sql`DELETE FROM chat_conversations WHERE booking_id = ANY(${testBookingIds}::uuid[])`;
      await sql`DELETE FROM notifications WHERE entity_id = ANY(${testBookingIds}::uuid[]) AND entity_type = 'booking'`;
    }

    // Find invoices linked to test clients/bookings
    const testInvoices = await sql`
      SELECT id, invoice_number FROM invoices
      WHERE client_id = ANY(${testClientIds}::uuid[])
         OR booking_id = ANY(${testBookingIds}::uuid[])
    `;
    const testInvoiceIds = testInvoices.map((i: any) => i.id);
    if (testInvoiceIds.length > 0) {
      await sql`DELETE FROM invoice_line_items WHERE invoice_id = ANY(${testInvoiceIds}::uuid[])`;
      await sql`DELETE FROM payments WHERE invoice_id = ANY(${testInvoiceIds}::uuid[])`;
      await sql`DELETE FROM receipts WHERE invoice_id = ANY(${testInvoiceIds}::uuid[])`;
      await sql`DELETE FROM notifications WHERE entity_id = ANY(${testInvoiceIds}::uuid[]) AND entity_type = 'invoice'`;
    }

    // Find quotations linked to test clients/bookings
    const testQuotations = await sql`
      SELECT id, quotation_number FROM quotations
      WHERE client_id = ANY(${testClientIds}::uuid[])
         OR booking_id = ANY(${testBookingIds}::uuid[])
    `;
    const testQuotationIds = testQuotations.map((q: any) => q.id);
    if (testQuotationIds.length > 0) {
      await sql`DELETE FROM quotation_line_items WHERE quotation_id = ANY(${testQuotationIds}::uuid[])`;
      await sql`DELETE FROM notifications WHERE entity_id = ANY(${testQuotationIds}::uuid[]) AND entity_type = 'quotation'`;
    }

    // Find payments linked to test clients
    const testPayments = await sql`
      SELECT id FROM payments WHERE client_id = ANY(${testClientIds}::uuid[])
    `;
    const testPaymentIds = testPayments.map((p: any) => p.id);
    if (testPaymentIds.length > 0) {
      await sql`DELETE FROM receipts WHERE payment_id = ANY(${testPaymentIds}::uuid[])`;
    }

    // Now delete all parent records
    await sql`DELETE FROM follow_ups WHERE client_id = ANY(${testClientIds}::uuid[])`;
    await sql`DELETE FROM follow_ups WHERE booking_id = ANY(${testBookingIds}::uuid[])`;
    if (testInvoiceIds.length > 0) await sql`DELETE FROM invoices WHERE id = ANY(${testInvoiceIds}::uuid[])`;
    if (testQuotationIds.length > 0) await sql`DELETE FROM quotations WHERE id = ANY(${testQuotationIds}::uuid[])`;
    if (testPaymentIds.length > 0) await sql`DELETE FROM payments WHERE id = ANY(${testPaymentIds}::uuid[])`;
    await sql`DELETE FROM bookings WHERE id = ANY(${testBookingIds}::uuid[])`;
    await sql`DELETE FROM clients WHERE id = ANY(${testClientIds}::uuid[])`;
  }

  // Also clean up standalone test/generic data in activity_log
  const deletedActivity = await sql`
    DELETE FROM activity_log
    WHERE summary ILIKE '%test%' OR summary ILIKE '%codex%' OR summary ILIKE '%chat test%'
    RETURNING id
  `;
  console.log(`  Deleted ${deletedActivity.length} test activity_log entries`);

  // Also clean up any quotation_line_items with TEST in description
  const deletedTestQLI = await sql`
    DELETE FROM quotation_line_items
    WHERE description ILIKE '%test%'
    RETURNING id
  `;
  if (deletedTestQLI.length > 0) {
    console.log(`  Deleted ${deletedTestQLI.length} test quotation line items`);
    // Clean up orphaned quotations (with no line items left)
    const orphanedQuotations = await sql`
      DELETE FROM quotations q
      WHERE NOT EXISTS (SELECT 1 FROM quotation_line_items qli WHERE qli.quotation_id = q.id)
        AND NOT EXISTS (SELECT 1 FROM invoice_line_items ili WHERE ili.invoice_id = q.converted_to_invoice_id)
      RETURNING id, quotation_number
    `;
    if (orphanedQuotations.length > 0) {
      console.log(`  Cleaned up ${orphanedQuotations.length} orphaned quotations: ${orphanedQuotations.map((q: any) => q.quotation_number).join(", ")}`);
    }
  }

  console.log("[Step 1] Cleanup complete.");

  // ── 2. FETCH REFERENCE DATA ──────────────────────────────────────────────
  console.log("\n[Step 2] Fetching reference data...");

  const services = await sql`
    SELECT id, name, slug, price_cents, duration_minutes FROM services WHERE active = true ORDER BY sort_order
  `;
  console.log(`  Found ${services.length} services`);

  const users = await sql`SELECT id, name, email FROM users ORDER BY created_at`;
  const adminUser = users[0];
  const staffUser = users[1] || users[0];
  console.log(`  Using admin: ${adminUser.name}, staff: ${staffUser.name}`);

  const sequences = await sql`SELECT * FROM document_number_sequences`;
  const invoiceSeq = sequences.find((s: any) => s.document_type === "invoice");
  const receiptSeq = sequences.find((s: any) => s.document_type === "receipt");
  console.log(`  Invoice next: ${invoiceSeq.next_number}, Receipt next: ${receiptSeq.next_number}`);

  // ── 3. CREATE REALISTIC CLIENTS ──────────────────────────────────────────
  console.log("\n[Step 3] Creating realistic clients...");

  const clientData = [
    { fullName: "Lukas Amupanda", phone: "+264 81 122 3344" },
    { fullName: "Selma Nangombe", phone: "+264 81 234 5567" },
    { fullName: "Tomas Shikongo", phone: "+264 81 345 6789" },
    { fullName: "Nangula Shekupe", phone: "+264 81 456 7890", email: "nangula.s@example.com" },
    { fullName: "Eveline de Klerk", phone: "+264 81 567 8901", email: "eveline.dk@example.com" },
    { fullName: "Benuel Kasuto", phone: "+264 81 678 9012" },
    { fullName: "Anna-Marie !Hoaeb", phone: "+264 81 789 0123", email: "annahoaeb@example.com" },
    { fullName: "Petrus Nghilangwa", phone: "+264 81 890 1234" },
    { fullName: "Martha Garises", phone: "+264 81 901 2345", email: "martha.g@example.com" },
    { fullName: "Simeon Amutenya", phone: "+264 81 012 3456" },
  ];

  const createdClients: any[] = [];
  for (const c of clientData) {
    const [client] = await sql`
      INSERT INTO clients (id, full_name, phone, normalized_phone, email, preferred_contact_method)
      VALUES (gen_random_uuid(), ${c.fullName}, ${c.phone}, ${c.phone.replace(/\s/g, "")}, ${c.email || null}, 'phone')
      RETURNING id, full_name, phone
    `;
    createdClients.push(client);
    console.log(`  Created client: ${client.full_name} (${client.phone})`);
  }

  // ── 4. CREATE REALISTIC BOOKINGS ─────────────────────────────────────────
  console.log("\n[Step 4] Creating realistic bookings...");

  const now = new Date();
  const bookingConfigs = [
    { clientIdx: 0, serviceIdx: 0, status: "completed", source: "website_form", daysOffset: -14, hour: 9, minute: 0, clientType: "returning" },
    { clientIdx: 1, serviceIdx: 1, status: "completed", source: "manual_admin", daysOffset: -10, hour: 10, minute: 30, clientType: "new" },
    { clientIdx: 2, serviceIdx: 2, status: "completed", source: "phone", daysOffset: -7, hour: 14, minute: 0, clientType: "new" },
    { clientIdx: 3, serviceIdx: 3, status: "completed", source: "website_form", daysOffset: -5, hour: 11, minute: 0, clientType: "new" },
    { clientIdx: 4, serviceIdx: 0, status: "confirmed", source: "manual_admin", daysOffset: 3, hour: 8, minute: 0, clientType: "new" },
    { clientIdx: 5, serviceIdx: 1, status: "confirmed", source: "website_form", daysOffset: 5, hour: 10, minute: 0, clientType: "new" },
    { clientIdx: 6, serviceIdx: 0, status: "new_request", source: "chatbot", daysOffset: 7, hour: 9, minute: 30, clientType: "new" },
    { clientIdx: 7, serviceIdx: 2, status: "new_request", source: "website_form", daysOffset: 10, hour: 15, minute: 0, clientType: "returning" },
    { clientIdx: 8, serviceIdx: 3, status: "new_request", source: "chatbot", daysOffset: 14, hour: 11, minute: 0, clientType: "new" },
    { clientIdx: 0, serviceIdx: 0, status: "cancelled", source: "website_form", daysOffset: -3, hour: 8, minute: 30, clientType: "returning" },
    { clientIdx: 9, serviceIdx: 1, status: "new_request", source: "phone", daysOffset: 2, hour: 14, minute: 30, clientType: "new" },
    { clientIdx: 3, serviceIdx: 0, status: "confirmed", source: "manual_admin", daysOffset: 8, hour: 10, minute: 0, clientType: "returning" },
  ];

  const createdBookings: any[] = [];
  for (const cfg of bookingConfigs) {
    const client = createdClients[cfg.clientIdx];
    const service = services[cfg.serviceIdx];
    const dt = new Date(now);
    dt.setDate(dt.getDate() + cfg.daysOffset);
    dt.setHours(cfg.hour, cfg.minute, 0, 0);

    const ref = `SWC-BKG-${formatDate(dt)}-${randomChars(4)}`;

    const [booking] = await sql`
      INSERT INTO bookings (
        id, reference, client_id, service_id, service_name, service_price_cents,
        service_duration_minutes, preferred_at, status, source, preferred_contact_method, client_type, note
      ) VALUES (
        gen_random_uuid(), ${ref}, ${client.id}, ${service.id}, ${service.name}, ${service.price_cents},
        ${service.duration_minutes}, ${dt}, ${cfg.status}, ${cfg.source}, 'phone', ${cfg.clientType},
        ${cfg.clientIdx === 4 ? "Referred by a friend who visited last month" : null}
      )
      RETURNING id, reference, status, service_name, preferred_at
    `;

    createdBookings.push(booking);

    // Create status history
    await sql`
      INSERT INTO booking_status_history (id, booking_id, to_status, created_at)
      VALUES (gen_random_uuid(), ${booking.id}, ${cfg.status}, ${dt})
    `;

    // Create booking answers for new requests and confirmed
    if (cfg.status !== "cancelled") {
      const questions = ["Are you currently undergoing chemotherapy?", "Are you currently taking strong medication such as antibiotics?", "Do you have a pacemaker or another implanted electronic medical device?"];
      for (const q of questions) {
        // Flag one answer for variety on the chatbot booking
        const flagged = cfg.source === "chatbot" && q === "Are you currently undergoing chemotherapy?" ? true : false;
        await sql`
          INSERT INTO booking_answers (id, booking_id, question_text, answer, flagged)
          VALUES (gen_random_uuid(), ${booking.id}, ${q}, ${flagged ? "yes" : "no"}, ${flagged})
        `;
      }
    }

    console.log(`  Created booking: ${booking.reference} - ${service.name} for ${client.full_name} [${cfg.status}]`);
  }

  // ── 5. CREATE INVOICES ───────────────────────────────────────────────────
  console.log("\n[Step 5] Creating invoices...");

  const invoiceConfigs = [
    { bookingIdx: 0, extraItems: [] },
    { bookingIdx: 1, extraItems: [{ description: "Wellness Report", unitPriceCents: 15000 }] },
    { bookingIdx: 2, extraItems: [] },
    { bookingIdx: 3, extraItems: [{ description: "Dietary Consultation Follow-up", unitPriceCents: 10000 }] },
  ];

  const createdInvoices: any[] = [];
  let invNum = invoiceSeq.next_number;

  for (const ic of invoiceConfigs) {
    const booking = createdBookings[ic.bookingIdx];
    const client = createdClients[bookingConfigs[ic.bookingIdx].clientIdx];
    const service = services.find((s: any) => s.name === booking.service_name) || services[0];

    const invoiceRef = `${invoiceSeq.prefix}${String(invNum).padStart(invoiceSeq.padding, "0")}`;
    invNum++;

    const subtotalCents = service.price_cents + ic.extraItems.reduce((sum: number, item: any) => sum + item.unitPriceCents, 0);
    const totalCents = subtotalCents; // No tax/discount for now

    const issueDate = new Date(booking.preferred_at);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const [invoice] = await sql`
      INSERT INTO invoices (
        id, invoice_number, client_id, booking_id, issue_date, due_date,
        subtotal_cents, discount_cents, tax_cents, total_cents, amount_paid_cents, balance_cents,
        status, notes, terms, created_by_user_id, issued_at
      ) VALUES (
        gen_random_uuid(), ${invoiceRef}, ${client.id}, ${booking.id}, ${issueDate}, ${dueDate},
        ${subtotalCents}, 0, 0, ${totalCents}, 0, ${totalCents},
        'issued', 'Thank you for your visit.', 'Payment due within 30 days.', ${staffUser.id}, ${issueDate}
      )
      RETURNING id, invoice_number, total_cents, status
    `;

    // Create line items
    let sortOrder = 0;
    await sql`
      INSERT INTO invoice_line_items (id, invoice_id, service_id, description, quantity, unit_price_cents, sort_order)
      VALUES (gen_random_uuid(), ${invoice.id}, ${service.id}, ${service.name}, 1, ${service.price_cents}, ${sortOrder})
    `;
    sortOrder++;

    for (const item of ic.extraItems) {
      await sql`
        INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_price_cents, sort_order)
        VALUES (gen_random_uuid(), ${invoice.id}, ${item.description}, 1, ${item.unitPriceCents}, ${sortOrder})
      `;
      sortOrder++;
    }

    // Create activity log entry
    await sql`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, summary)
      VALUES (gen_random_uuid(), ${staffUser.id}, 'invoice.issued', 'invoice', ${invoice.id},
        ${`Invoice ${invoiceRef} issued for N\$${(totalCents / 100).toFixed(2)}`})
    `;

    createdInvoices.push(invoice);
    console.log(`  Created invoice: ${invoiceRef} - N\$${(totalCents / 100).toFixed(2)} for ${client.full_name}`);
  }

  // Update the invoice sequence
  await sql`
    UPDATE document_number_sequences SET next_number = ${invNum}, updated_at = NOW()
    WHERE document_type = 'invoice'
  `;

  // ── 6. CREATE PAYMENTS AND RECEIPTS ──────────────────────────────────────
  console.log("\n[Step 6] Creating payments and receipts...");

  const paymentConfigs = [
    { invoiceIdx: 0, amountCents: 65000, method: "card", ref: "TXN-CARD-001" },
    { invoiceIdx: 1, amountCents: 65000, method: "cash", ref: null },
    { invoiceIdx: 2, amountCents: 20000, method: "bank_transfer", ref: "EFT-20260701" },
  ];

  let recNum = receiptSeq.next_number;

  for (const pc of paymentConfigs) {
    const invoice = createdInvoices[pc.invoiceIdx];
    const booking = createdBookings[invoiceConfigs[pc.invoiceIdx].bookingIdx];
    const client = createdClients[bookingConfigs[invoiceConfigs[pc.invoiceIdx].bookingIdx].clientIdx];

    const paymentDate = new Date(booking.preferred_at);
    if (pc.method === "cash") paymentDate.setDate(paymentDate.getDate() + 1);

    const [payment] = await sql`
      INSERT INTO payments (
        id, client_id, invoice_id, booking_id, amount_cents, payment_date,
        method, reference, recorded_by_user_id
      ) VALUES (
        gen_random_uuid(), ${client.id}, ${invoice.id}, ${booking.id},
        ${pc.amountCents}, ${paymentDate}, ${pc.method}, ${pc.ref}, ${staffUser.id}
      )
      RETURNING id, amount_cents, method
    `;

    // Update invoice balance
    const newPaidCents = pc.amountCents;
    const newBalanceCents = Math.max(0, invoice.total_cents - newPaidCents);
    const newStatus = newBalanceCents === 0 ? "paid" : "partially_paid";
    await sql`
      UPDATE invoices
      SET amount_paid_cents = ${newPaidCents}, balance_cents = ${newBalanceCents}, status = ${newStatus}, updated_at = NOW()
      WHERE id = ${invoice.id}
    `;

    // Create receipt
    const receiptRef = `${receiptSeq.prefix}${String(recNum).padStart(receiptSeq.padding, "0")}`;
    recNum++;

    await sql`
      INSERT INTO receipts (
        id, receipt_number, payment_id, client_id, booking_id, invoice_id,
        amount_cents, payment_date, payment_method, payment_reference, description, received_by_user_id
      ) VALUES (
        gen_random_uuid(), ${receiptRef}, ${payment.id}, ${client.id}, ${booking.id}, ${invoice.id},
        ${pc.amountCents}, ${paymentDate}, ${pc.method}, ${pc.ref},
        ${`Payment for ${booking.service_name}`}, ${staffUser.id}
      )
    `;

    // Activity log
    await sql`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, summary)
      VALUES (gen_random_uuid(), ${staffUser.id}, 'payment.recorded', 'payment', ${payment.id},
        ${`Payment of N\$${(pc.amountCents / 100).toFixed(2)} recorded (${pc.method})`})
    `;

    await sql`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, summary)
      VALUES (gen_random_uuid(), ${staffUser.id}, 'receipt.created', 'receipt', ${payment.id},
        ${`Receipt ${receiptRef} issued for N\$${(pc.amountCents / 100).toFixed(2)}`})
    `;

    console.log(`  Created payment: N\$${(pc.amountCents / 100).toFixed(2)} via ${pc.method} for invoice ${invoice.invoice_number}`);
    console.log(`  Created receipt: ${receiptRef}`);
  }

  // Update receipt sequence
  await sql`
    UPDATE document_number_sequences SET next_number = ${recNum}, updated_at = NOW()
    WHERE document_type = 'receipt'
  `;

  // ── 7. CREATE FOLLOW-UPS ────────────────────────────────────────────────
  console.log("\n[Step 7] Creating follow-ups...");

  const followUpConfigs = [
    { bookingIdx: 4, method: "phone", status: "pending", daysOffset: 1, note: "Call to confirm appointment time" },
    { bookingIdx: 6, method: "phone", status: "due_today", daysOffset: 0, note: "Follow up on chatbot booking request" },
    { bookingIdx: 5, method: "phone", status: "pending", daysOffset: -1, note: "Remind about upcoming appointment" },
    { bookingIdx: 7, method: "phone", status: "overdue", daysOffset: -3, note: "Client has not responded to confirmation" },
    { bookingIdx: 0, method: "phone", status: "completed", daysOffset: -7, note: "Post-appointment check-in" },
  ];

  for (const fc of followUpConfigs) {
    const booking = createdBookings[fc.bookingIdx];
    const client = createdClients[bookingConfigs[fc.bookingIdx].clientIdx];

    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + fc.daysOffset);
    dueAt.setHours(10, 0, 0, 0);

    let completedAt = null;
    let status = fc.status;
    if (fc.status === "completed") {
      completedAt = new Date(dueAt);
      completedAt.setHours(completedAt.getHours() + 1);
    }

    // Map statuses - follow_ups uses 'pending', 'overdue', 'completed', 'cancelled'
    // But 'due_today' is not a real status in the schema - it should be 'pending'
    if (status === "due_today") status = "pending";

    await sql`
      INSERT INTO follow_ups (
        id, client_id, booking_id, due_at, method, assigned_user_id,
        internal_note, status, completed_at
      ) VALUES (
        gen_random_uuid(), ${client.id}, ${booking.id}, ${dueAt}, ${fc.method},
        ${staffUser.id}, ${fc.note}, ${status}, ${completedAt}
      )
    `;

    console.log(`  Created follow-up: ${fc.method} for ${client.full_name} - ${fc.note} [${fc.status}]`);
  }

  // ── 8. CREATE ACTIVITY LOG ENTRIES ───────────────────────────────────────
  console.log("\n[Step 8] Creating activity log entries...");

  const activityEntries = [
    { action: "booking.created", entityType: "booking", summary: `Booking ${createdBookings[6].reference} created via chatbot`, daysOffset: -1 },
    { action: "booking.created", entityType: "booking", summary: `Booking ${createdBookings[7].reference} created via website`, daysOffset: -2 },
    { action: "booking.status.confirmed", entityType: "booking", summary: `Booking ${createdBookings[5].reference}: new_request → confirmed`, daysOffset: -1 },
    { action: "client.created", entityType: "client", summary: "Created client Martha Garises", daysOffset: -5 },
    { action: "client.created", entityType: "client", summary: "Created client Simeon Amutenya", daysOffset: -3 },
    { action: "follow_up.completed", entityType: "follow_up", summary: "Follow-up completed for Lukas Amupanda (phone)", daysOffset: -8 },
  ];

  for (const ae of activityEntries) {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() + ae.daysOffset);

    await sql`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, summary, created_at)
      VALUES (gen_random_uuid(), ${staffUser.id}, ${ae.action}, ${ae.entityType}, gen_random_uuid(), ${ae.summary}, ${createdAt})
    `;
  }

  console.log(`  Created ${activityEntries.length} activity log entries`);

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log("\n=== SEED COMPLETE ===");
  console.log(`Clients created: ${createdClients.length}`);
  console.log(`Bookings created: ${createdBookings.length}`);
  console.log(`Invoices created: ${createdInvoices.length}`);
  console.log(`Follow-ups created: ${followUpConfigs.length}`);
  console.log(`Activity log entries created: ${activityEntries.length}`);
}

main()
  .catch((err) => {
    console.error("ERROR:", err);
    process.exit(1);
  })
  .finally(() => sql.end());
