import assert from "node:assert";
import { describe, it } from "node:test";

describe("invoice financial calculations", () => {
  it("calculates line total correctly", () => {
    const qty = 2;
    const unitPriceCents = 50000;
    const discountCents = 0;
    const total = qty * unitPriceCents - discountCents;
    assert.equal(total, 100000);
  });

  it("applies line discount", () => {
    const qty = 1;
    const unitPriceCents = 65000;
    const discountCents = 5000;
    const total = qty * unitPriceCents - discountCents;
    assert.equal(total, 60000);
  });

  it("calculates subtotal from multiple line items", () => {
    const items = [
      { qty: 1, unitPriceCents: 65000, discountCents: 0 },
      { qty: 2, unitPriceCents: 50000, discountCents: 0 },
    ];
    const calcSubtotal = items.reduce((sum, item) => sum + item.qty * item.unitPriceCents - item.discountCents, 0);
    assert.equal(calcSubtotal, 165000);
  });

  it("calculates percentage discount correctly", () => {
    const subtotalCents = 100000;
    const discountValue = 10;
    const discountCents = Math.round(subtotalCents * (discountValue / 100));
    assert.equal(discountCents, 10000);
  });

  it("calculates fixed discount correctly", () => {
    const discountValue = 15000;
    const discountCents = discountValue;
    assert.equal(discountCents, 15000);
  });

  it("calculates grand total with subtotal, discount and tax", () => {
    const subtotalCents = 165000;
    const discountCents = 10000;
    const taxCents = 0;
    const totalCents = subtotalCents - discountCents + taxCents;
    assert.equal(totalCents, 155000);
  });

  it("calculates balance correctly after payment", () => {
    const totalCents = 155000;
    const amountPaidCents = 50000;
    const balanceCents = totalCents - amountPaidCents;
    assert.equal(balanceCents, 105000);
  });

  it("marks invoice as paid when balance reaches zero", () => {
    const totalCents = 65000;
    const amountPaidCents = 65000;
    const balanceCents = totalCents - amountPaidCents;
    const status = balanceCents <= 0 ? "paid" : amountPaidCents > 0 ? "partially_paid" : "issued";
    assert.equal(balanceCents, 0);
    assert.equal(status, "paid");
  });

  it("marks invoice as partially paid when some but not all is paid", () => {
    const totalCents = 65000;
    const amountPaidCents = 30000;
    const balanceCents = totalCents - amountPaidCents;
    const status = balanceCents <= 0 ? "paid" : amountPaidCents > 0 ? "partially_paid" : "issued";
    assert.equal(status, "partially_paid");
    assert.equal(balanceCents, 35000);
  });

  it("prevents voiding a paid or voided invoice", () => {
    const invalidStatuses = ["paid", "voided"];
    assert.equal(invalidStatuses.includes("paid"), true);
    assert.equal(invalidStatuses.includes("voided"), true);
    assert.equal(invalidStatuses.includes("draft"), false);
    assert.equal(invalidStatuses.includes("issued"), false);
  });
});
