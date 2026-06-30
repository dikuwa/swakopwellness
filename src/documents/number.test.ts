import assert from "node:assert";
import { describe, it } from "node:test";

describe("document number formatting", () => {
  it("pads numbers correctly", () => {
    const prefix = "SWC-INV-";
    const padding = 5;
    const num = 1;
    const padded = String(num).padStart(padding, "0");
    assert.equal(`${prefix}${padded}`, "SWC-INV-00001");
  });

  it("handles larger numbers", () => {
    const prefix = "SWC-REC-";
    const padding = 5;
    const num = 42;
    const padded = String(num).padStart(padding, "0");
    assert.equal(`${prefix}${padded}`, "SWC-REC-00042");
  });

  it("handles numbers exceeding padding", () => {
    const prefix = "SWC-QUO-";
    const padding = 3;
    const num = 1234;
    const padded = String(num).padStart(padding, "0");
    assert.equal(`${prefix}${padded}`, "SWC-QUO-1234");
  });
});
