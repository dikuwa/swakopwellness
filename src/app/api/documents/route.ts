import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/auth/session";
import { createUnifiedDocument, listUnifiedDocuments, type UnifiedDocumentType } from "@/lib/models/document";

export const dynamic = "force-dynamic";

function dollarsToCents(value: unknown) {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Math.round((Number.isFinite(num) ? num : 0) * 100);
}

type DocumentLineItemPayload = {
  serviceId?: string | null;
  description?: unknown;
  quantity?: unknown;
  unitPriceCents?: unknown;
  unitPrice?: unknown;
  discountCents?: unknown;
  discount?: unknown;
};

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.permissions, "financials:view")) {
    return NextResponse.json({ error: "You are not authorised to view documents." }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const result = await listUnifiedDocuments({
    page,
    type: url.searchParams.get("type") || undefined,
    status: url.searchParams.get("status") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    q: url.searchParams.get("q") || undefined,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.permissions, "documents:create")) {
    return NextResponse.json({ error: "You are not authorised to create documents." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });

  const type = String(body.type ?? body.documentType ?? "").toLowerCase() as UnifiedDocumentType;
  const lineItems = Array.isArray(body.lineItems)
    ? (body.lineItems as DocumentLineItemPayload[]).map((item) => ({
        serviceId: item.serviceId ?? null,
        description: String(item.description ?? "").trim(),
        quantity: Number.parseInt(String(item.quantity ?? "1"), 10) || 1,
        unitPriceCents: item.unitPriceCents != null ? Number(item.unitPriceCents) : dollarsToCents(item.unitPrice),
        discountCents: item.discountCents != null ? Number(item.discountCents) : dollarsToCents(item.discount),
      })).filter((item) => item.description && item.unitPriceCents >= 0)
    : [];

  const result = await createUnifiedDocument({
    type,
    bookingId: body.bookingId || null,
    clientId: body.clientId || null,
    issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
    validUntil: body.validUntil ? new Date(body.validUntil) : null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    lineItems,
    manualEntry: !!body.manualEntry,
    createdByUserId: user.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ document: result }, { status: 201 });
}
