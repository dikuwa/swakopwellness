import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/auth/session";
import { recordWorkflowPayment } from "@/lib/models/payment";

export const dynamic = "force-dynamic";

const methodMap: Record<string, string> = {
  cash: "cash",
  card: "card",
  eft: "bank_transfer",
  voucher: "voucher",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.permissions, "payments:record")) {
    return NextResponse.json({ error: "You are not authorised to record payments." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });

  const amountCents = body.amountCents != null
    ? Number(body.amountCents)
    : Math.round(Number.parseFloat(String(body.amount ?? "0")) * 100);

  const methodKey = String(body.method ?? "").toLowerCase();
  const method = methodMap[methodKey] ?? methodKey;

  const result = await recordWorkflowPayment({
    bookingId: body.bookingId || null,
    invoiceId: body.invoiceId || null,
    clientId: body.clientId || null,
    method,
    amountCents,
    reference: body.reference || null,
    recordedByUserId: user.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ payment: result }, { status: 201 });
}
