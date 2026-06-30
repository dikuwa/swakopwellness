import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookings, clients, invoices, payments } from "@/db/schema";

export const dynamic = "force-dynamic";

type CsvValue = string | number | Date | boolean | null | undefined;

function csvEscape(value: CsvValue) {
  if (value instanceof Date) return value.toISOString();
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: CsvValue[][]) {
  return [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}

function csvResponse(type: string, csv: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="swakop-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

async function bookingsCsv() {
  await requirePermission("bookings:view");
  const db = getDb();
  const rows = await db
    .select({
      reference: bookings.reference,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      serviceName: bookings.serviceName,
      servicePriceCents: bookings.servicePriceCents,
      preferredAt: bookings.preferredAt,
      alternativeAt: bookings.alternativeAt,
      status: bookings.status,
      source: bookings.source,
      preferredContactMethod: bookings.preferredContactMethod,
      clientType: bookings.clientType,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .orderBy(desc(bookings.createdAt));

  return csvResponse("bookings", toCsv(
    ["Reference", "Client", "Phone", "Email", "Service", "Service Price", "Preferred At", "Alternative At", "Status", "Source", "Preferred Contact", "Client Type", "Created At"],
    rows.map((row) => [row.reference, row.clientName, row.clientPhone, row.clientEmail, row.serviceName, (row.servicePriceCents / 100).toFixed(2), row.preferredAt, row.alternativeAt, row.status, row.source, row.preferredContactMethod, row.clientType, row.createdAt]),
  ));
}

async function clientsCsv() {
  await requirePermission("clients:view");
  const db = getDb();
  const rows = await db
    .select({
      fullName: clients.fullName,
      phone: clients.phone,
      email: clients.email,
      whatsappNumber: clients.whatsappNumber,
      preferredContactMethod: clients.preferredContactMethod,
      lastBookingAt: clients.lastBookingAt,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .orderBy(desc(clients.createdAt));

  return csvResponse("clients", toCsv(
    ["Client", "Phone", "Email", "WhatsApp", "Preferred Contact", "Last Booking At", "Created At"],
    rows.map((row) => [row.fullName, row.phone, row.email, row.whatsappNumber, row.preferredContactMethod, row.lastBookingAt, row.createdAt]),
  ));
}

async function invoicesCsv() {
  await requirePermission("financials:view");
  const db = getDb();
  const rows = await db
    .select({
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.fullName,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      subtotalCents: invoices.subtotalCents,
      discountCents: invoices.discountCents,
      taxCents: invoices.taxCents,
      totalCents: invoices.totalCents,
      amountPaidCents: invoices.amountPaidCents,
      balanceCents: invoices.balanceCents,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt));

  return csvResponse("invoices", toCsv(
    ["Invoice", "Client", "Issue Date", "Due Date", "Subtotal", "Discount", "Tax", "Total", "Amount Paid", "Balance", "Status", "Created At"],
    rows.map((row) => [row.invoiceNumber, row.clientName, row.issueDate, row.dueDate, (row.subtotalCents / 100).toFixed(2), (row.discountCents / 100).toFixed(2), (row.taxCents / 100).toFixed(2), (row.totalCents / 100).toFixed(2), (row.amountPaidCents / 100).toFixed(2), (row.balanceCents / 100).toFixed(2), row.status, row.createdAt]),
  ));
}

async function paymentsCsv() {
  await requirePermission("financials:view");
  const db = getDb();
  const rows = await db
    .select({
      clientName: clients.fullName,
      invoiceNumber: invoices.invoiceNumber,
      amountCents: payments.amountCents,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
      voidedAt: payments.voidedAt,
      voidReason: payments.voidReason,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id))
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .orderBy(desc(payments.paymentDate));

  return csvResponse("payments", toCsv(
    ["Client", "Invoice", "Amount", "Payment Date", "Method", "Reference", "Voided At", "Void Reason", "Created At"],
    rows.map((row) => [row.clientName, row.invoiceNumber, (row.amountCents / 100).toFixed(2), row.paymentDate, row.method, row.reference, row.voidedAt, row.voidReason, row.createdAt]),
  ));
}

export async function GET(_request: Request, props: { params: Promise<{ type: string }> }) {
  const { type } = await props.params;

  if (type === "bookings") return bookingsCsv();
  if (type === "clients") return clientsCsv();
  if (type === "invoices") return invoicesCsv();
  if (type === "payments") return paymentsCsv();

  return NextResponse.json({ error: "Unknown export type" }, { status: 404 });
}
