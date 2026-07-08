import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getInitialBookingStatus,
  getAvailableActions,
  validTransitions,
  bookingStatuses,
} from "./status";

describe("booking status", () => {
  it("marks flagged suitability bookings for review", () => {
    assert.equal(getInitialBookingStatus(true), "requires_review");
    assert.equal(getInitialBookingStatus(false), "new_request");
  });

  it("marks schedule conflicts for review", () => {
    assert.equal(getInitialBookingStatus(false, true), "requires_review");
    assert.equal(getInitialBookingStatus(true, true), "requires_review");
  });
});

describe("valid transitions", () => {
  it("has terminal statuses with no transitions out", () => {
    assert.deepEqual(validTransitions.completed, []);
    assert.deepEqual(validTransitions.cancelled, []);
    assert.deepEqual(validTransitions.no_show, []);
  });

  it("allows reschedule from confirmed only", () => {
    const actions = getAvailableActions("confirmed");
    assert.ok(actions.includes("rescheduled"));
    assert.ok(actions.includes("completed"));
    assert.ok(actions.includes("cancelled"));
    assert.ok(actions.includes("no_show"));
  });

  it("allows a confirmed booking to be rescheduled again", () => {
    const actions = getAvailableActions("rescheduled");
    assert.ok(actions.includes("confirmed"));
    assert.ok(actions.includes("cancelled"));
  });

  it("allows new_request to be reviewed, confirmed, or cancelled", () => {
    const actions = getAvailableActions("new_request");
    assert.deepEqual(actions, ["requires_review", "confirmed", "cancelled"]);
  });

  it("returns empty array for unknown status", () => {
    const actions = getAvailableActions("nonexistent_status");
    assert.deepEqual(actions, []);
  });

  it("all statuses in bookingStatuses have validTransition entries", () => {
    for (const status of bookingStatuses) {
      assert.ok(
        status in validTransitions,
        `${status} should have a validTransitions entry`,
      );
    }
  });

  it("all target statuses in validTransitions exist in bookingStatuses", () => {
    const statusSet = new Set(bookingStatuses);
    for (const [fromStatus, targets] of Object.entries(validTransitions)) {
      for (const target of targets) {
        assert.ok(
          statusSet.has(target as typeof bookingStatuses[number]),
          `Transition target "${target}" from "${fromStatus}" is not a valid booking status`,
        );
      }
    }
  });
});
