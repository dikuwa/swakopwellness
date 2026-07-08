import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateUnifiedTotals, canApplyPayment } from "./document";

describe("unified document calculations", () => {
  it("calculates totals from booking line items", () => {
    const result = calculateUnifiedTotals([
      { description: "Consultation", quantity: 1, unitPriceCents: 65000, discountCents: 0 },
      { description: "Follow-up", quantity: 2, unitPriceCents: 20000, discountCents: 5000 },
    ]);

    assert.equal(result.subtotalCents, 100000);
    assert.equal(result.taxCents, 0);
    assert.equal(result.totalCents, 100000);
  });

  it("rejects payments above invoice outstanding balance", () => {
    const result = canApplyPayment(70000, 65000);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false ? result.message : "", "Payment cannot exceed the outstanding invoice balance.");
  });

  it("allows exact balance payment for automatic receipt generation", () => {
    const result = canApplyPayment(65000, 65000);
    assert.equal(result.ok, true);
  });
});
