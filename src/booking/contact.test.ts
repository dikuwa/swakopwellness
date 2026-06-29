import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeEmail, normalizePhone } from "./contact";

describe("contact normalization", () => {
  it("normalizes email and phone for matching", () => {
    assert.equal(normalizeEmail(" Client@Example.COM "), "client@example.com");
    assert.equal(normalizePhone("+264 64 463 200"), "26464463200");
  });

  it("returns null for empty contact values", () => {
    assert.equal(normalizeEmail(" "), null);
    assert.equal(normalizePhone(""), null);
  });
});
