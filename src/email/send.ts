import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings, businessSettings, clients, communicationSettings, invoiceLineItems, invoices, services } from "@/db/schema";
import { env } from "@/lib/env";

function formatCents(cents: number): string {
  return `N$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-NA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

export function getFromEmail(): string | null {
  return env.RESEND_FROM_EMAIL || null;
}

type EmailBusinessDetails = {
  businessName: string;
  address: string;
  telephone: string;
};

async function getBusinessDetails(): Promise<EmailBusinessDetails> {
  try {
    const db = getDb();
    const [settings] = await db
      .select({ businessName: businessSettings.businessName, address: businessSettings.address, telephone: businessSettings.telephone })
      .from(businessSettings)
      .limit(1);
    if (!settings) throw new Error("Business settings not configured.");
    return settings;
  } catch {
    return { businessName: "Business", address: "", telephone: "" };
  }
}

function wrapHtml(body: string, business: EmailBusinessDetails): string {
  const footerRows = [business.address, business.telephone].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:40px auto">
<tr><td style="background:#ffffff;border-radius:16px;padding:40px 32px">
${body}
</td></tr>
<tr><td style="padding:24px 32px 0;text-align:center;font-size:13px;color:#888">
<p style="margin:0">${business.businessName}</p>
${footerRows.map((row) => `<p style="margin:4px 0">${row}</p>`).join("")}
</td></tr>
</table>
</body>
</html>`;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] Resend not configured — skipping email to", to);
    return { ok: true };
  }
  const from = getFromEmail();
  if (!from) {
    console.warn("[email] Sender email not configured — skipping email to", to);
    return { ok: true };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Failed to send:", message);
    return { ok: false, error: message };
  }
}

export async function sendBookingConfirmation(
  bookingId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getDb();
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    if (!booking) return { ok: false, error: "Booking not found." };

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, booking.clientId))
      .limit(1);
    if (!client) return { ok: false, error: "Client not found." };
    if (!client.email) return { ok: true };

    const [service] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, booking.serviceId!))
      .limit(1);

    const business = await getBusinessDetails();

    const dateStr = formatDate(booking.preferredAt);
    const timeStr = formatTime(booking.preferredAt);
    const altStr =
      booking.alternativeAt
        ? `${formatDate(booking.alternativeAt)} at ${formatTime(booking.alternativeAt)}`
        : "None";

    const html = wrapHtml(
      `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:600">Booking Confirmation</h1>
<p style="margin:0 0 24px;font-size:15px;color:#555">Your booking request has been received.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">
<tr><td style="padding:8px 0;color:#888;width:120px">Reference</td><td style="padding:8px 0;font-weight:600">${booking.reference}</td></tr>
<tr><td style="padding:8px 0;color:#888">Service</td><td style="padding:8px 0">${service?.name ?? booking.serviceName}</td></tr>
<tr><td style="padding:8px 0;color:#888">Client</td><td style="padding:8px 0">${client.fullName}</td></tr>
<tr><td style="padding:8px 0;color:#888">Date</td><td style="padding:8px 0">${dateStr}</td></tr>
<tr><td style="padding:8px 0;color:#888">Time</td><td style="padding:8px 0">${timeStr}</td></tr>
<tr><td style="padding:8px 0;color:#888">Alternative</td><td style="padding:8px 0">${altStr}</td></tr>
</table>

<p style="margin:24px 0 0;font-size:14px;color:#555">We will confirm your appointment shortly.${business.telephone ? ` If you have any questions, please call us at ${business.telephone}.` : ""}</p>
`.trim(),
      business,
    );

    return sendNotificationEmail(client.email, `Booking Confirmation — ${booking.reference} — ${business.businessName}`, html);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export async function sendInvoiceEmail(
  invoiceId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getDb();
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    if (!invoice) return { ok: false, error: "Invoice not found." };

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);
    if (!client) return { ok: false, error: "Client not found." };
    if (!client.email) return { ok: false, error: "Client has no email address." };

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .orderBy(invoiceLineItems.sortOrder);

    const business = await getBusinessDetails();

    const itemsHtml = items
      .map(
        (item) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${item.description}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatCents(item.unitPriceCents)}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${item.discountCents > 0 ? formatCents(item.discountCents) : "—"}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatCents(item.quantity * item.unitPriceCents - item.discountCents)}</td></tr>`,
      )
      .join("");

    const html = wrapHtml(
      `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:600">Invoice ${invoice.invoiceNumber}</h1>
<p style="margin:0 0 24px;font-size:15px;color:#555">Thank you for choosing ${business.businessName}.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">
<tr><td style="padding:8px 0;color:#888;width:120px">Invoice</td><td style="padding:8px 0;font-weight:600">${invoice.invoiceNumber}</td></tr>
<tr><td style="padding:8px 0;color:#888">Issue Date</td><td style="padding:8px 0">${formatDate(invoice.issueDate)}</td></tr>
<tr><td style="padding:8px 0;color:#888">Due Date</td><td style="padding:8px 0">${formatDate(invoice.dueDate)}</td></tr>
<tr><td style="padding:8px 0;color:#888">Client</td><td style="padding:8px 0">${client.fullName}</td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0;font-size:14px">
<thead>
<tr style="font-weight:600;color:#888;font-size:13px">
<th style="padding:8px 0;border-bottom:2px solid #eee;text-align:left">Description</th>
<th style="padding:8px 0;border-bottom:2px solid #eee;text-align:center">Qty</th>
<th style="padding:8px 0;border-bottom:2px solid #eee;text-align:right">Unit Price</th>
<th style="padding:8px 0;border-bottom:2px solid #eee;text-align:right">Discount</th>
<th style="padding:8px 0;border-bottom:2px solid #eee;text-align:right">Total</th>
</tr>
</thead>
<tbody>
${itemsHtml}
</tbody>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">
<tr><td style="padding:6px 0;text-align:right;color:#888">Subtotal</td><td style="padding:6px 0;text-align:right;width:100px">${formatCents(invoice.subtotalCents)}</td></tr>
${invoice.discountCents > 0 ? `<tr><td style="padding:6px 0;text-align:right;color:#888">Discount</td><td style="padding:6px 0;text-align:right;color:#d32f2f">-${formatCents(invoice.discountCents)}</td></tr>` : ""}
${invoice.taxCents > 0 ? `<tr><td style="padding:6px 0;text-align:right;color:#888">Tax</td><td style="padding:6px 0;text-align:right">${formatCents(invoice.taxCents)}</td></tr>` : ""}
<tr><td style="padding:8px 0;text-align:right;font-weight:600;border-top:2px solid #333;font-size:16px">Total</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:2px solid #333;font-size:16px">${formatCents(invoice.totalCents)}</td></tr>
</table>

<p style="margin:24px 0 0;font-size:14px;color:#555">Payment is due by ${formatDate(invoice.dueDate)}.${business.telephone ? ` If you have any questions, please call us at ${business.telephone}.` : ""}</p>
`.trim(),
      business,
    );

    return sendNotificationEmail(client.email, `Invoice ${invoice.invoiceNumber} — ${business.businessName}`, html);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export async function sendBookingNotificationToStaff(
  bookingId: string,
): Promise<void> {
  try {
    const db = getDb();
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    if (!booking) return;

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, booking.clientId))
      .limit(1);
    if (!client) return;

    const [comm] = await db
      .select()
      .from(communicationSettings)
      .limit(1);

    const to = comm?.bookingNotificationEmail;
    if (!to) return;

    const business = await getBusinessDetails();

    const html = wrapHtml(
      `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:600">New Booking Request</h1>
<p style="margin:0 0 24px;font-size:15px;color:#555">A new booking has been submitted.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">
<tr><td style="padding:8px 0;color:#888;width:120px">Reference</td><td style="padding:8px 0;font-weight:600">${booking.reference}</td></tr>
<tr><td style="padding:8px 0;color:#888">Client</td><td style="padding:8px 0">${client.fullName}</td></tr>
<tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0">${client.phone || "—"}</td></tr>
<tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0">${client.email || "—"}</td></tr>
<tr><td style="padding:8px 0;color:#888">Service</td><td style="padding:8px 0">${booking.serviceName}</td></tr>
<tr><td style="padding:8px 0;color:#888">Preferred</td><td style="padding:8px 0">${formatDate(booking.preferredAt)} at ${formatTime(booking.preferredAt)}</td></tr>
<tr><td style="padding:8px 0;color:#888">Status</td><td style="padding:8px 0;text-transform:capitalize">${booking.status.replaceAll("_", " ")}</td></tr>
</table>

<p style="margin:24px 0 0;font-size:14px;color:#555">Please review and follow up with the client.</p>
`.trim(),
      business,
    );

    await sendNotificationEmail(to, `New Booking — ${booking.reference} — ${business.businessName}`, html);
  } catch (err) {
    console.error("[email] Failed to send staff notification:", err);
  }
}
