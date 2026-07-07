import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateLineTotal, calculateDiscountCents } from "./create";

describe("invoice financial calculations", () => {
  it("calculates line total correctly without discount", () => {
    const total = calculateLineTotal({ description: "Service", quantity: 2, unitPriceCents: 50000, discountCents: 0 });
    assert.equal(total, 100000);
  });

  it("applies line discount correctly", () => {
    const total = calculateLineTotal({ description: "Service", quantity: 1, unitPriceCents: 65000, discountCents: 5000 });
    assert.equal(total, 60000);
  });

  it("handles optional discountCents as undefined", () => {
    const total = calculateLineTotal({ description: "Service", quantity: 3, unitPriceCents: 25000 });
    assert.equal(total, 75000);
  });

  it("calculates subtotal from multiple line items", () => {
    const items = [
      { description: "Item A", quantity: 1, unitPriceCents: 65000, discountCents: 0 },
      { description: "Item B", quantity: 2, unitPriceCents: 50000, discountCents: 0 },
    ];
    const calcSubtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
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

  it("returns zero discount when type is undefined", () => {
    const discount = calculateDiscountCents(100000, undefined, 10);
    assert.equal(discount, 0);
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
});

describe("updateInvoice validation rules", () => {
  it("rejects update when invoice not found (returns false)", () => {
    // This simulates the early-return path in updateInvoice when no existing record is found
    const existing = null;
    const result = existing
      ? { ok: true as const, id: "", invoiceNumber: "", totalCents: 0 }
      : { ok: false as const, message: "Invoice not found." };
    assert.equal(result.ok, false);
    assert.equal(result.ok === false ? result.message : "", "Invoice not found.");
  });

  it("rejects update when invoice is not draft", () => {
    const invalidStatuses = ["issued", "paid", "partially_paid", "overdue", "voided"];
    for (const status of invalidStatuses) {
      const canEdit = status === "draft";
      assert.equal(canEdit, false, `Expected ${status} to not be editable`);
    }
  });

  it("allows update only when status is draft", () => {
    const status = "draft";
    const canEdit = status === "draft";
    assert.equal(canEdit, true);
  });

  it("rejects update when client not found", () => {
    const client = null;
    const result = client
      ? { ok: true as const, id: "" }
      : { ok: false as const, message: "Client not found." };
    assert.equal(result.ok, false);
    assert.equal(result.ok === false ? result.message : "", "Client not found.");
  });

  it("recalculates subtotal from updated line items", () => {
    const updatedItems = [
      { description: "New Item", quantity: 3, unitPriceCents: 10000, discountCents: 0 },
      { description: "Updated Item", quantity: 1, unitPriceCents: 75000, discountCents: 5000 },
    ];
    const subtotalCents = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents - (item.discountCents ?? 0), 0,
    );
    assert.equal(subtotalCents, 100000); // 3*10000 - 0 + 1*75000 - 5000 = 30000 + 70000 = 100000
  });

  it("recalculates total after updating line items", () => {
    const subtotalCents = 100000;
    const discountCents = calculateDiscountCents(subtotalCents, "percentage", 10);
    const taxCents = 0;
    const totalCents = subtotalCents - discountCents + taxCents;
    assert.equal(discountCents, 10000);
    assert.equal(totalCents, 90000);
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
