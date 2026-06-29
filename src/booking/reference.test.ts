import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBookingReference } from "./reference";

describe("createBookingReference", () => {
  it("creates a human-readable booking reference", () => {
    assert.equal(createBookingReference(new Date("2026-06-29T10:00:00Z"), 0), "SWC-BKG-20260629-0000");
  });
});
