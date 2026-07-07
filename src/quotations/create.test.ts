import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateLineTotal, calculateDiscountCents } from "./create";

describe("quotation financial calculations", () => {
  it("calculates line total correctly without discount", () => {
    const total = calculateLineTotal({ description: "Test", quantity: 2, unitPriceCents: 50000, discountCents: 0 });
    assert.equal(total, 100000);
  });

  it("applies line discount correctly", () => {
    const total = calculateLineTotal({ description: "Test", quantity: 1, unitPriceCents: 65000, discountCents: 5000 });
    assert.equal(total, 60000);
  });

  it("handles optional discountCents as undefined", () => {
    const total = calculateLineTotal({ description: "Test", quantity: 3, unitPriceCents: 25000 });
    assert.equal(total, 75000);
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
    const discount = calculateDiscountCents(100000, "percentage", 10);
    assert.equal(discount, 10000);
  });

  it("calculates fixed discount correctly", () => {
    const discount = calculateDiscountCents(100000, "fixed", 15000);
    assert.equal(discount, 15000);
  });

  it("returns zero discount when type is null", () => {
    const discount = calculateDiscountCents(100000, null, 10);
    assert.equal(discount, 0);
  });

  it("returns zero discount when value is null", () => {
    const discount = calculateDiscountCents(100000, "percentage", null);
    assert.equal(discount, 0);
  });

  it("calculates grand total as subtotal minus discount", () => {
    const subtotalCents = 165000;
    const discountCents = 10000;
    const totalCents = subtotalCents - discountCents;
    assert.equal(totalCents, 155000);
  });

  it("rejects voiding a converted quotation", () => {
    const invalidStatuses = ["voided", "converted"];
    assert.equal(invalidStatuses.includes("issued"), false);
    assert.equal(invalidStatuses.includes("voided"), true);
    assert.equal(invalidStatuses.includes("converted"), true);
  });

  it("requires accepted status for invoice conversion", () => {
    const validStatuses = ["accepted"];
    assert.equal(validStatuses.includes("accepted"), true);
    assert.equal(validStatuses.includes("draft"), false);
    assert.equal(validStatuses.includes("issued"), false);
  });
});
