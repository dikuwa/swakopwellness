import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getFollowUpDisplayStatus } from "./status";

describe("follow-up status", () => {
  it("calculates due today and overdue states", () => {
    const now = new Date("2026-07-16T12:00:00Z");

    assert.equal(getFollowUpDisplayStatus(new Date("2026-07-16T08:00:00Z"), now), "due_today");
    assert.equal(getFollowUpDisplayStatus(new Date("2026-07-15T08:00:00Z"), now), "overdue");
    assert.equal(getFollowUpDisplayStatus(new Date("2026-07-17T08:00:00Z"), now), "pending");
  });

  it("preserves completed and cancelled states", () => {
    const now = new Date("2026-07-16T12:00:00Z");

    assert.equal(getFollowUpDisplayStatus(new Date("2026-07-15T08:00:00Z"), now, "completed"), "completed");
    assert.equal(getFollowUpDisplayStatus(new Date("2026-07-15T08:00:00Z"), now, "cancelled"), "cancelled");
  });
});
