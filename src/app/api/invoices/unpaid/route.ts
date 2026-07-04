import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { invoices } from "@/db/schema";
import { requireAuth } from "@/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ invoices: [] });
    }

    const db = getDb();
    const unpaidInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalCents: invoices.totalCents,
        amountPaidCents: invoices.amountPaidCents,
        balanceCents: invoices.balanceCents,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.clientId, clientId),
          inArray(invoices.status, ["draft", "issued", "partially_paid", "overdue"]),
        ),
      )
      .orderBy(invoices.issueDate);

    return NextResponse.json({ invoices: unpaidInvoices });
  } catch {
    return NextResponse.json({ invoices: [], error: "Unauthorized" }, { status: 401 });
  }
}
