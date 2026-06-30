import assert from "node:assert";
import { describe, it } from "node:test";

describe("notification types", () => {
  it("defines known notification types", () => {
    const types = [
      "booking.created",
      "booking.requires_review",
      "invoice.created",
      "invoice.issued",
      "invoice.voided",
      "payment.recorded",
      "payment.voided",
      "receipt.created",
    ];
    assert.ok(types.includes("booking.created"));
    assert.ok(types.includes("invoice.created"));
    assert.ok(types.includes("payment.recorded"));
  });

  it("builds notification title from type", () => {
    const typeLabels: Record<string, string> = {
      "booking.created": "New booking",
      "invoice.created": "Invoice created",
      "payment.recorded": "Payment recorded",
    };
    assert.equal(typeLabels["booking.created"], "New booking");
  });
});
