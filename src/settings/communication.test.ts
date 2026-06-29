import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEnabledContactMethods } from "./communication";

describe("communication settings", () => {
  it("hides WhatsApp when disabled", () => {
    assert.deepEqual(getEnabledContactMethods({ enableCalls: true, enableEmailContact: true, enableWhatsapp: false }), ["phone", "email"]);
  });

  it("includes WhatsApp only when enabled", () => {
    assert.deepEqual(getEnabledContactMethods({ enableCalls: true, enableEmailContact: false, enableWhatsapp: true }), ["phone", "whatsapp"]);
  });
});
