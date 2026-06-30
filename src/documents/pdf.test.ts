import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateInvoicePdf, generateReceiptPdf, type BusinessData, type InvoiceData, type ReceiptData } from "./pdf";

const business: BusinessData = {
  businessName: "Swakop Wellness Centre",
  address: "Shop 11, Wasserfall Street, Swakopmund, Namibia",
  phone: "+264 64 463 200",
  email: "swakopwellnesscentre@gmail.com",
};

describe("document PDFs", () => {
  it("generates a complete invoice PDF buffer", async () => {
    const invoice: InvoiceData = {
      invoiceNumber: "SWC-INV-00001",
      issueDate: new Date("2026-06-30T08:00:00Z"),
      dueDate: new Date("2026-07-07T08:00:00Z"),
      clientName: "Test Client",
      clientPhone: "+264 81 000 0000",
      clientEmail: "client@example.com",
      lineItems: [{ description: "Basic Health Scan", quantity: 1, unitPriceCents: 65000, discountCents: 0, totalCents: 65000 }],
      subtotalCents: 65000,
      discountCents: 0,
      taxCents: 0,
      totalCents: 65000,
      paidCents: 0,
      balanceCents: 65000,
      notes: "",
      terms: "",
    };

    const pdf = await generateInvoicePdf(invoice, business);

    assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
    assert.ok(pdf.length > 1000);
  });

  it("generates a complete receipt PDF buffer", async () => {
    const receipt: ReceiptData = {
      receiptNumber: "SWC-REC-00001",
      paymentDate: new Date("2026-06-30T08:00:00Z"),
      clientName: "Test Client",
      clientPhone: "+264 81 000 0000",
      clientEmail: "client@example.com",
      invoiceNumber: "SWC-INV-00001",
      amountCents: 65000,
      method: "cash",
      reference: "",
      description: "Basic Health Scan",
      notes: "",
    };

    const pdf = await generateReceiptPdf(receipt, business);

    assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
    assert.ok(pdf.length > 1000);
  });
});
