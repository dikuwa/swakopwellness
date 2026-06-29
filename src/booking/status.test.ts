import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getInitialBookingStatus } from "./status";

describe("booking status", () => {
  it("marks flagged suitability bookings for review", () => {
    assert.equal(getInitialBookingStatus(true), "requires_review");
    assert.equal(getInitialBookingStatus(false), "new_request");
  });
});
