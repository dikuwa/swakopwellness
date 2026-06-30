import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chatbotBookingSource } from "./create";

describe("chatbot booking creation", () => {
  it("uses the chatbot booking source", () => {
    assert.equal(chatbotBookingSource, "chatbot");
  });
});
