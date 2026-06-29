import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approvedBookingSummary, getChatbotSafetyReply } from "./safety";

describe("chatbot safety", () => {
  it("refuses diagnosis and treatment requests", () => {
    const reply = getChatbotSafetyReply("Can you diagnose this and tell me what medication to stop?");

    assert.equal(typeof reply, "string");
    assert.match(reply ?? "", /cannot diagnose/);
  });

  it("does not claim confirmed availability after saving a request", () => {
    assert.match(approvedBookingSummary("SWC-BKG-20260629-0000", "new_request"), /request was received/);
    assert.doesNotMatch(approvedBookingSummary("SWC-BKG-20260629-0000", "new_request"), /confirmed/i);
  });
});
