import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasAtLeastOneContact, isContactMethodAvailable, parseDateTime } from "./validation";

describe("booking validation", () => {
  it("requires at least one contact method", () => {
    assert.equal(hasAtLeastOneContact({ phone: "", email: "", whatsappNumber: "" }), false);
    assert.equal(hasAtLeastOneContact({ phone: "064", email: "", whatsappNumber: "" }), true);
  });

  it("honours disabled WhatsApp preference", () => {
    assert.equal(isContactMethodAvailable("whatsapp", { enableCalls: true, enableEmailContact: true, enableWhatsapp: false }), false);
  });

  it("parses valid date and time values", () => {
    assert.equal(parseDateTime("2026-06-29", "08:30") instanceof Date, true);
    assert.equal(parseDateTime("not-a-date", "08:30"), null);
  });

  it("treats submitted appointment times as Africa/Windhoek local time", () => {
    assert.equal(parseDateTime("2026-07-23", "13:30")?.toISOString(), "2026-07-23T11:30:00.000Z");
  });
});
